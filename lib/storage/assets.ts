import { and, eq, isNull } from "drizzle-orm"

import { UPLOAD_ACCEPTED_TYPES, UPLOAD_LIMITS } from "@/lib/documents/defaults"
import { db } from "@/lib/db"
import { documentAssets, documents } from "@/lib/db/schema"
import { getPublicAssetUrl, getS3Config } from "@/lib/storage/s3"

export type UploadKind = keyof typeof UPLOAD_LIMITS

export function sanitizeObjectName(fileName: string) {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .toLowerCase()
}

export function assertUploadAllowed(input: {
  kind: UploadKind
  mimeType: string
  sizeBytes: number
}) {
  const maxSize = UPLOAD_LIMITS[input.kind]

  if (input.sizeBytes <= 0 || input.sizeBytes > maxSize) {
    throw new Error("上传文件大小不符合限制。")
  }

  const allowedPrefixes = UPLOAD_ACCEPTED_TYPES[input.kind]

  if (
    allowedPrefixes.length > 0 &&
    !allowedPrefixes.some((prefix) => input.mimeType.startsWith(prefix))
  ) {
    throw new Error("上传文件类型不支持。")
  }
}

export async function assertDocumentWritable(documentId: string, userId: string) {
  const [document] = await db
    .select({
      id: documents.id,
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
    throw new Error("目标文档不存在或不可写。")
  }
}

export async function createPendingAssetRecord(input: {
  documentId: string
  kind: UploadKind
  mimeType: string
  objectKey: string
  sizeBytes: number
  userId: string
}) {
  const { bucket } = getS3Config()
  const [asset] = await db
    .insert(documentAssets)
    .values({
      bucket,
      documentId: input.documentId,
      id: crypto.randomUUID(),
      kind: input.kind,
      mimeType: input.mimeType,
      objectKey: input.objectKey,
      ownerUserId: input.userId,
      publicUrl: getPublicAssetUrl(input.objectKey),
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

export async function markAssetReadyRecord(input: {
  assetId: string
  documentId: string
  durationSeconds?: number
  height?: number
  userId: string
  width?: number
}) {
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
        eq(documentAssets.ownerUserId, input.userId)
      )
    )
    .returning({
      id: documentAssets.id,
      kind: documentAssets.kind,
      mimeType: documentAssets.mimeType,
      publicUrl: documentAssets.publicUrl,
    })

  if (!asset) {
    throw new Error("上传资产不存在或已失效。")
  }

  return asset
}
