import { and, asc, desc, eq, isNull } from "drizzle-orm"

import { RECENT_DOCUMENT_LIMIT } from "@/lib/documents/defaults"
import { buildDocumentTree } from "@/lib/documents/tree"
import type {
  SerializedDocument,
  WorkspaceSnapshot,
} from "@/lib/documents/types"
import { db } from "@/lib/db"
import { documentFolders, documents } from "@/lib/db/schema"

function toIsoString(value: Date) {
  return value.toISOString()
}

export async function getDocumentTree(userId: string) {
  const [folders, documentItems] = await Promise.all([
    db
      .select({
        createdAt: documentFolders.createdAt,
        id: documentFolders.id,
        name: documentFolders.name,
        parentFolderId: documentFolders.parentFolderId,
        sortIndex: documentFolders.sortIndex,
        updatedAt: documentFolders.updatedAt,
      })
      .from(documentFolders)
      .where(
        and(
          eq(documentFolders.ownerUserId, userId),
          isNull(documentFolders.deletedAt)
        )
      )
      .orderBy(asc(documentFolders.sortIndex), asc(documentFolders.name)),
    db
      .select({
        createdAt: documents.createdAt,
        folderId: documents.folderId,
        id: documents.id,
        sortIndex: documents.sortIndex,
        title: documents.title,
        updatedAt: documents.updatedAt,
      })
      .from(documents)
      .where(and(eq(documents.ownerUserId, userId), isNull(documents.deletedAt)))
      .orderBy(asc(documents.sortIndex), desc(documents.updatedAt)),
  ])

  return buildDocumentTree(
    folders.map((folder) => ({
      ...folder,
      createdAt: toIsoString(folder.createdAt),
      updatedAt: toIsoString(folder.updatedAt),
    })),
    documentItems.map((document) => ({
      ...document,
      createdAt: toIsoString(document.createdAt),
      updatedAt: toIsoString(document.updatedAt),
    }))
  )
}

export async function getRecentDocuments(userId: string) {
  const recentDocuments = await db
    .select({
      folderId: documents.folderId,
      id: documents.id,
      title: documents.title,
      updatedAt: documents.updatedAt,
    })
    .from(documents)
    .where(and(eq(documents.ownerUserId, userId), isNull(documents.deletedAt)))
    .orderBy(desc(documents.updatedAt))
    .limit(RECENT_DOCUMENT_LIMIT)

  return recentDocuments.map((document) => ({
    ...document,
    updatedAt: toIsoString(document.updatedAt),
  }))
}

export async function getDocumentById(documentId: string, userId: string) {
  const [document] = await db
    .select({
      content: documents.content,
      contentVersion: documents.contentVersion,
      createdAt: documents.createdAt,
      folderId: documents.folderId,
      id: documents.id,
      ownerUserId: documents.ownerUserId,
      title: documents.title,
      updatedAt: documents.updatedAt,
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
    return null
  }

  return {
    ...document,
    content: document.content ?? [],
    createdAt: toIsoString(document.createdAt),
    updatedAt: toIsoString(document.updatedAt),
  } satisfies SerializedDocument
}

export async function getWorkspaceSnapshot(userId: string) {
  const [tree, recentDocuments] = await Promise.all([
    getDocumentTree(userId),
    getRecentDocuments(userId),
  ])

  return {
    recentDocuments,
    tree,
  } satisfies WorkspaceSnapshot
}
