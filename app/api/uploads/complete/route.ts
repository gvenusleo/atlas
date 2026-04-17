import { NextResponse } from "next/server"

import { auth } from "@/auth"
import {
  assertDocumentWritable,
  markAssetReadyRecord,
} from "@/lib/storage/assets"

type CompletePayload = {
  assetId: string
  documentId: string
  durationSeconds?: number
  fileName: string
  height?: number
  width?: number
}

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user.id) {
      return NextResponse.json({ message: "未授权。" }, { status: 401 })
    }

    const payload = (await request.json()) as CompletePayload

    await assertDocumentWritable(payload.documentId, session.user.id)

    const asset = await markAssetReadyRecord({
      assetId: payload.assetId,
      documentId: payload.documentId,
      durationSeconds: payload.durationSeconds,
      height: payload.height,
      userId: session.user.id,
      width: payload.width,
    })

    return NextResponse.json({
      asset: {
        assetId: asset.id,
        kind: asset.kind,
        mimeType: asset.mimeType,
        name: payload.fileName,
        url: asset.publicUrl,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "确认上传失败，请稍后重试。",
      },
      { status: 400 }
    )
  }
}
