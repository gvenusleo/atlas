"use server"

import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_FOLDER_NAME,
  EMPTY_DOCUMENT_CONTENT,
} from "@/lib/documents/defaults"
import { getWorkspaceSnapshot } from "@/lib/documents/queries"
import { getSession } from "@/lib/auth-session"
import { db } from "@/lib/db"
import { documentAssets, documentFolders, documents } from "@/lib/db/schema"

async function requireUserId() {
  const session = await getSession()

  if (!session?.user.id) {
    throw new Error("当前会话已失效，请重新登录。")
  }

  return session.user.id
}

function normalizeDocumentTitle(title: string) {
  const trimmed = title.trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_DOCUMENT_TITLE
}

function normalizeFolderName(name?: string) {
  const trimmed = name?.trim() ?? ""
  return trimmed.length > 0 ? trimmed : DEFAULT_FOLDER_NAME
}

async function ensureFolderOwnership(
  folderId: string,
  userId: string,
  options?: {
    allowRoot?: boolean
  }
): Promise<{
  id: string
  name: string
  parentFolderId: string | null
}> {
  const [folder] = await db
    .select({
      id: documentFolders.id,
      name: documentFolders.name,
      parentFolderId: documentFolders.parentFolderId,
    })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.id, folderId),
        eq(documentFolders.ownerUserId, userId),
        isNull(documentFolders.deletedAt)
      )
    )
    .limit(1)

  if (!folder) {
    throw new Error("目标文件夹不存在或已被删除。")
  }

  if (!options?.allowRoot && folder.parentFolderId === null) {
    return folder
  }

  return folder
}

async function ensureDocumentOwnership(documentId: string, userId: string) {
  const [document] = await db
    .select({
      contentVersion: documents.contentVersion,
      folderId: documents.folderId,
      id: documents.id,
      title: documents.title,
    })
    .from(documents)
    .where(
      and(
        eq(documents.id, documentId),
        eq(documents.ownerUserId, userId),
        isNull(documents.deletedAt)
      )
    )
    .limit(1)

  if (!document) {
    throw new Error("目标文档不存在或已被删除。")
  }

  return document
}

async function getNextFolderSortIndex(
  userId: string,
  parentFolderId: string | null
): Promise<number> {
  const [sibling] = await db
    .select({
      sortIndex: documentFolders.sortIndex,
    })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.ownerUserId, userId),
        parentFolderId === null
          ? isNull(documentFolders.parentFolderId)
          : eq(documentFolders.parentFolderId, parentFolderId),
        isNull(documentFolders.deletedAt)
      )
    )
    .orderBy(desc(documentFolders.sortIndex))
    .limit(1)

  return (sibling?.sortIndex ?? -1) + 1
}

async function getNextDocumentSortIndex(
  userId: string,
  folderId: string | null
): Promise<number> {
  const [sibling] = await db
    .select({
      sortIndex: documents.sortIndex,
    })
    .from(documents)
    .where(
      and(
        eq(documents.ownerUserId, userId),
        folderId === null ? isNull(documents.folderId) : eq(documents.folderId, folderId),
        isNull(documents.deletedAt)
      )
    )
    .orderBy(desc(documents.sortIndex))
    .limit(1)

  return (sibling?.sortIndex ?? -1) + 1
}

function touchDocumentPaths(documentId?: string) {
  revalidatePath("/")

  if (documentId) {
    revalidatePath(`/documents/${documentId}`)
  }
}

export async function createDocument(input?: { folderId?: string | null }) {
  const userId = await requireUserId()
  const folderId = input?.folderId ?? null

  if (folderId) {
    await ensureFolderOwnership(folderId, userId)
  }

  const documentId = crypto.randomUUID()

  const [document] = await db
    .insert(documents)
    .values({
      content: EMPTY_DOCUMENT_CONTENT,
      folderId,
      id: documentId,
      ownerUserId: userId,
      sortIndex: await getNextDocumentSortIndex(userId, folderId),
      title: DEFAULT_DOCUMENT_TITLE,
    })
    .returning({
      createdAt: documents.createdAt,
      folderId: documents.folderId,
      id: documents.id,
      sortIndex: documents.sortIndex,
      title: documents.title,
      updatedAt: documents.updatedAt,
    })

  touchDocumentPaths(document.id)

  return {
    document: {
      ...document,
      createdAt: document.createdAt.toISOString(),
      type: "document" as const,
      updatedAt: document.updatedAt.toISOString(),
    },
    snapshot: await getWorkspaceSnapshot(userId),
  }
}

export async function createFolder(input?: {
  name?: string
  parentFolderId?: string | null
}) {
  const userId = await requireUserId()
  const parentFolderId = input?.parentFolderId ?? null

  if (parentFolderId) {
    await ensureFolderOwnership(parentFolderId, userId)
  }

  const [folder] = await db
    .insert(documentFolders)
    .values({
      id: crypto.randomUUID(),
      name: normalizeFolderName(input?.name),
      ownerUserId: userId,
      parentFolderId,
      sortIndex: await getNextFolderSortIndex(userId, parentFolderId),
    })
    .returning({
      createdAt: documentFolders.createdAt,
      id: documentFolders.id,
      name: documentFolders.name,
      parentFolderId: documentFolders.parentFolderId,
      sortIndex: documentFolders.sortIndex,
      updatedAt: documentFolders.updatedAt,
    })

  revalidatePath("/")

  return {
    folder: {
      ...folder,
      children: [],
      createdAt: folder.createdAt.toISOString(),
      type: "folder" as const,
      updatedAt: folder.updatedAt.toISOString(),
    },
    snapshot: await getWorkspaceSnapshot(userId),
  }
}

export async function renameDocument(input: {
  documentId: string
  title: string
}) {
  const userId = await requireUserId()
  const title = normalizeDocumentTitle(input.title)

  const [document] = await db
    .update(documents)
    .set({
      title,
    })
    .where(
      and(
        eq(documents.id, input.documentId),
        eq(documents.ownerUserId, userId),
        isNull(documents.deletedAt)
      )
    )
    .returning({
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
    })

  if (!document) {
    throw new Error("目标文档不存在或已被删除。")
  }

  touchDocumentPaths(document.id)

  return {
    documentId: document.id,
    title: document.title,
    updatedAt: document.updatedAt.toISOString(),
  }
}

export async function renameFolder(input: { folderId: string; name: string }) {
  const userId = await requireUserId()
  const name = normalizeFolderName(input.name)

  const [folder] = await db
    .update(documentFolders)
    .set({
      name,
    })
    .where(
      and(
        eq(documentFolders.id, input.folderId),
        eq(documentFolders.ownerUserId, userId),
        isNull(documentFolders.deletedAt)
      )
    )
    .returning({
      id: documentFolders.id,
      name: documentFolders.name,
    })

  if (!folder) {
    throw new Error("目标文件夹不存在或已被删除。")
  }

  revalidatePath("/")

  return {
    folderId: folder.id,
    name: folder.name,
  }
}

export async function moveDocumentToParent(input: { documentId: string }) {
  const userId = await requireUserId()
  const document = await ensureDocumentOwnership(input.documentId, userId)

  if (!document.folderId) {
    throw new Error("根目录文档不能继续上移。")
  }

  const folder = await ensureFolderOwnership(document.folderId, userId)
  const nextFolderId = folder.parentFolderId

  await db
    .update(documents)
    .set({
      folderId: nextFolderId,
      sortIndex: await getNextDocumentSortIndex(userId, nextFolderId),
    })
    .where(eq(documents.id, input.documentId))

  touchDocumentPaths(input.documentId)

  return {
    documentId: input.documentId,
    folderId: nextFolderId,
    snapshot: await getWorkspaceSnapshot(userId),
  }
}

export async function moveFolderToParent(input: { folderId: string }) {
  const userId = await requireUserId()
  const folder = await ensureFolderOwnership(input.folderId, userId, {
    allowRoot: true,
  })

  if (!folder.parentFolderId) {
    throw new Error("根目录文件夹不能继续上移。")
  }

  const parentFolder = await ensureFolderOwnership(folder.parentFolderId, userId, {
    allowRoot: true,
  })
  const nextParentFolderId = parentFolder.parentFolderId

  await db
    .update(documentFolders)
    .set({
      parentFolderId: nextParentFolderId,
      sortIndex: await getNextFolderSortIndex(userId, nextParentFolderId),
    })
    .where(eq(documentFolders.id, input.folderId))

  revalidatePath("/")

  return {
    folderId: input.folderId,
    parentFolderId: nextParentFolderId,
    snapshot: await getWorkspaceSnapshot(userId),
  }
}

export async function softDeleteDocument(input: { documentId: string }) {
  const userId = await requireUserId()
  const now = new Date()

  const [document] = await db
    .update(documents)
    .set({
      deletedAt: now,
    })
    .where(
      and(
        eq(documents.id, input.documentId),
        eq(documents.ownerUserId, userId),
        isNull(documents.deletedAt)
      )
    )
    .returning({
      id: documents.id,
    })

  if (!document) {
    throw new Error("目标文档不存在或已被删除。")
  }

  touchDocumentPaths(input.documentId)

  return {
    documentId: document.id,
  }
}

export async function softDeleteFolder(input: { folderId: string }) {
  const userId = await requireUserId()
  const now = new Date()

  await ensureFolderOwnership(input.folderId, userId, {
    allowRoot: true,
  })

  const folders = await db
    .select({
      id: documentFolders.id,
      parentFolderId: documentFolders.parentFolderId,
    })
    .from(documentFolders)
    .where(
      and(
        eq(documentFolders.ownerUserId, userId),
        isNull(documentFolders.deletedAt)
      )
    )

  const childrenByParent = new Map<string | null, string[]>()

  for (const folder of folders) {
    const siblings = childrenByParent.get(folder.parentFolderId) ?? []
    siblings.push(folder.id)
    childrenByParent.set(folder.parentFolderId, siblings)
  }

  const folderIds: string[] = []
  const queue = [input.folderId]

  while (queue.length > 0) {
    const nextId = queue.shift()

    if (!nextId) {
      continue
    }

    folderIds.push(nextId)
    queue.push(...(childrenByParent.get(nextId) ?? []))
  }

  const relatedDocuments = await db
    .select({
      id: documents.id,
    })
    .from(documents)
    .where(
      and(
        eq(documents.ownerUserId, userId),
        inArray(documents.folderId, folderIds),
        isNull(documents.deletedAt)
      )
    )

  await db.transaction(async (tx) => {
    if (relatedDocuments.length > 0) {
      await tx
        .update(documents)
        .set({
          deletedAt: now,
        })
        .where(inArray(documents.id, relatedDocuments.map((document) => document.id)))
    }

    await tx
      .update(documentFolders)
      .set({
        deletedAt: now,
      })
      .where(inArray(documentFolders.id, folderIds))
  })

  revalidatePath("/")

  return {
    deletedDocumentIds: relatedDocuments.map((document) => document.id),
    deletedFolderIds: folderIds,
  }
}

export async function saveDocumentTitle(input: {
  documentId: string
  title: string
}) {
  return renameDocument(input)
}

export async function saveDocumentContent(input: {
  content: unknown
  contentVersion: number
  documentId: string
}) {
  const userId = await requireUserId()
  const document = await ensureDocumentOwnership(input.documentId, userId)
  const content = Array.isArray(input.content) && input.content.length > 0
    ? (input.content as typeof EMPTY_DOCUMENT_CONTENT)
    : EMPTY_DOCUMENT_CONTENT

  if (document.contentVersion !== input.contentVersion) {
    return {
      conflict: true as const,
      contentVersion: document.contentVersion,
    }
  }

  const [updatedDocument] = await db
    .update(documents)
    .set({
      content,
      contentVersion: sql<number>`${documents.contentVersion} + 1`,
    })
    .where(
      and(
        eq(documents.id, input.documentId),
        eq(documents.ownerUserId, userId),
        eq(documents.contentVersion, input.contentVersion),
        isNull(documents.deletedAt)
      )
    )
    .returning({
      contentVersion: documents.contentVersion,
      updatedAt: documents.updatedAt,
    })

  if (!updatedDocument) {
    const latestDocument = await ensureDocumentOwnership(input.documentId, userId)

    return {
      conflict: true as const,
      contentVersion: latestDocument.contentVersion,
    }
  }

  touchDocumentPaths(input.documentId)

  return {
    conflict: false as const,
    contentVersion: updatedDocument.contentVersion,
    updatedAt: updatedDocument.updatedAt.toISOString(),
  }
}

export async function createPendingAsset(input: {
  documentId: string
  bucket: string
  kind: (typeof documentAssets.$inferInsert)["kind"]
  mimeType: string
  objectKey: string
  publicUrl: string
  sizeBytes: number
}) {
  const userId = await requireUserId()

  await ensureDocumentOwnership(input.documentId, userId)

  const [asset] = await db
    .insert(documentAssets)
    .values({
      bucket: input.bucket,
      documentId: input.documentId,
      id: crypto.randomUUID(),
      kind: input.kind,
      mimeType: input.mimeType,
      objectKey: input.objectKey,
      ownerUserId: userId,
      publicUrl: input.publicUrl,
      sizeBytes: input.sizeBytes,
      status: "pending",
      storageProvider: "s3",
    })
    .returning({
      id: documentAssets.id,
      publicUrl: documentAssets.publicUrl,
    })

  return asset
}

export async function markAssetReady(input: {
  assetId: string
  documentId: string
  durationSeconds?: number
  height?: number
  width?: number
}) {
  const userId = await requireUserId()

  const [asset] = await db
    .update(documentAssets)
    .set({
      durationSeconds: input.durationSeconds,
      height: input.height,
      status: "ready",
      width: input.width,
    })
    .where(
      and(
        eq(documentAssets.id, input.assetId),
        eq(documentAssets.documentId, input.documentId),
        eq(documentAssets.ownerUserId, userId)
      )
    )
    .returning({
      id: documentAssets.id,
      kind: documentAssets.kind,
      publicUrl: documentAssets.publicUrl,
    })

  if (!asset) {
    throw new Error("上传资产不存在或已失效。")
  }

  return asset
}
