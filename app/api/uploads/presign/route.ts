import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  assertDocumentWritable,
  assertUploadAllowed,
  createPendingAssetRecord,
  sanitizeObjectName,
  type UploadKind,
} from "@/lib/storage/assets"
import { createPresignedUploadUrl } from "@/lib/storage/s3"

type PresignPayload = {
  contentType: string
  documentId: string
  fileName: string
  kind: UploadKind
  sizeBytes: number
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user.id) {
      return NextResponse.json({ message: "未授权。" }, { status: 401 })
    }

    const payload = (await request.json()) as PresignPayload

    assertUploadAllowed({
      kind: payload.kind,
      mimeType: payload.contentType,
      sizeBytes: payload.sizeBytes,
    })

    await assertDocumentWritable(payload.documentId, session.user.id)

    const safeFileName = sanitizeObjectName(payload.fileName) || "upload"
    const assetId = crypto.randomUUID()
    const objectKey = `${session.user.id}/${payload.documentId}/${assetId}-${safeFileName}`
    const uploadUrl = await createPresignedUploadUrl({
      contentType: payload.contentType,
      objectKey,
    })
    const asset = await createPendingAssetRecord({
      documentId: payload.documentId,
      kind: payload.kind,
      mimeType: payload.contentType,
      objectKey,
      sizeBytes: payload.sizeBytes,
      userId: session.user.id,
    })

    return NextResponse.json({
      asset: {
        assetId: asset.id,
        url: asset.publicUrl,
      },
      upload: {
        method: "PUT",
        uploadUrl,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "生成上传地址失败，请稍后重试。",
      },
      { status: 400 }
    )
  }
}
