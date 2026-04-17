"use client"

import * as React from "react"

import {
  AudioLinesIcon,
  FileUpIcon,
  FilmIcon,
  ImageIcon,
  LinkIcon,
} from "lucide-react"
import { type Descendant, isUrl, KEYS } from "platejs"
import { useEditorRef } from "platejs/react"
import { toast } from "sonner"
import { useFilePicker } from "use-file-picker"

import { UPLOAD_ACCEPTED_TYPES, UPLOAD_LIMITS } from "@/lib/documents/defaults"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

import { ToolbarButton } from "./toolbar"

type UploadKind = keyof typeof UPLOAD_LIMITS

type MediaToolbarButtonProps = React.ComponentProps<typeof ToolbarButton> & {
  documentId: string
  nodeType: string
}

type MediaConfig = {
  accept: string[]
  icon: React.ReactNode
  kind?: UploadKind
  supportsUrl?: boolean
  title: string
  tooltip: string
}

type PresignResponse = {
  asset: {
    assetId: string
    url: string
  }
  upload: {
    method: "PUT"
    uploadUrl: string
  }
}

type CompleteResponse = {
  asset: {
    assetId: string
    kind: string
    mimeType: string
    name: string
    url: string
  }
}

const MEDIA_CONFIG: Record<string, MediaConfig> = {
  [KEYS.audio]: {
    accept: ["audio/*"],
    icon: <AudioLinesIcon />,
    kind: "audio",
    title: "上传音频",
    tooltip: "音频",
  },
  [KEYS.file]: {
    accept: ["*"],
    icon: <FileUpIcon />,
    kind: "file",
    title: "上传文件",
    tooltip: "文件",
  },
  [KEYS.img]: {
    accept: ["image/*"],
    icon: <ImageIcon />,
    kind: "image",
    title: "上传图片",
    tooltip: "图片",
  },
  [KEYS.mediaEmbed]: {
    accept: [],
    icon: <LinkIcon />,
    supportsUrl: true,
    title: "嵌入外链",
    tooltip: "外链嵌入",
  },
  [KEYS.video]: {
    accept: ["video/*"],
    icon: <FilmIcon />,
    kind: "video",
    title: "上传视频",
    tooltip: "视频",
  },
}

function matchesAcceptedType(kind: UploadKind, mimeType: string) {
  const acceptedPrefixes = UPLOAD_ACCEPTED_TYPES[kind]

  if (acceptedPrefixes.length === 0) {
    return true
  }

  return acceptedPrefixes.some((prefix) => mimeType.startsWith(prefix))
}

function assertClientUploadAllowed(kind: UploadKind, file: File) {
  if (file.size <= 0 || file.size > UPLOAD_LIMITS[kind]) {
    throw new Error(`${file.name} 超出大小限制。`)
  }

  if (!matchesAcceptedType(kind, file.type)) {
    throw new Error(`${file.name} 的类型不支持。`)
  }
}

function createMediaNode(
  nodeType: string,
  asset: CompleteResponse["asset"]
): Descendant {
  return {
    assetId: asset.assetId,
    children: [{ text: "" }],
    name: asset.name,
    type: nodeType,
    url: asset.url,
  } as Descendant
}

async function readResponseMessage(response: Response) {
  try {
    const payload = (await response.json()) as { message?: string }

    return payload.message || "请求失败，请稍后重试。"
  } catch {
    return "请求失败，请稍后重试。"
  }
}

async function readImageMetadata(file: File) {
  return new Promise<{ height: number; width: number }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new window.Image()

    image.onload = () => {
      resolve({
        height: image.naturalHeight,
        width: image.naturalWidth,
      })
      URL.revokeObjectURL(objectUrl)
    }
    image.onerror = () => {
      reject(new Error("读取图片尺寸失败。"))
      URL.revokeObjectURL(objectUrl)
    }
    image.src = objectUrl
  })
}

async function readAvMetadata(
  file: File,
  tagName: "audio" | "video"
): Promise<{
  durationSeconds?: number
  height?: number
  width?: number
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const media = document.createElement(tagName)

    media.preload = "metadata"
    media.onloadedmetadata = () => {
      resolve({
        durationSeconds: Number.isFinite(media.duration)
          ? Math.round(media.duration)
          : undefined,
        height:
          tagName === "video"
            ? (media as HTMLVideoElement).videoHeight
            : undefined,
        width:
          tagName === "video"
            ? (media as HTMLVideoElement).videoWidth
            : undefined,
      })
      URL.revokeObjectURL(objectUrl)
    }
    media.onerror = () => {
      reject(new Error("读取媒体元数据失败。"))
      URL.revokeObjectURL(objectUrl)
    }
    media.src = objectUrl
  })
}

async function readUploadMetadata(kind: UploadKind, file: File) {
  if (kind === "image") {
    return readImageMetadata(file)
  }

  if (kind === "video") {
    return readAvMetadata(file, "video")
  }

  if (kind === "audio") {
    return readAvMetadata(file, "audio")
  }

  return {}
}

export function MediaToolbarButton({
  documentId,
  nodeType,
  ...props
}: MediaToolbarButtonProps) {
  const editor = useEditorRef()
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const currentConfig = MEDIA_CONFIG[nodeType]

  const uploadFiles = React.useCallback(
    async (files: File[]) => {
      if (!currentConfig?.kind || files.length === 0) {
        return
      }

      for (const file of files) {
        try {
          assertClientUploadAllowed(currentConfig.kind, file)

          const presignResponse = await fetch("/api/uploads/presign", {
            body: JSON.stringify({
              contentType: file.type || "application/octet-stream",
              documentId,
              fileName: file.name,
              kind: currentConfig.kind,
              sizeBytes: file.size,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          })

          if (!presignResponse.ok) {
            throw new Error(await readResponseMessage(presignResponse))
          }

          const presignPayload =
            (await presignResponse.json()) as PresignResponse
          const uploadResponse = await fetch(presignPayload.upload.uploadUrl, {
            body: file,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            method: presignPayload.upload.method,
          })

          if (!uploadResponse.ok) {
            throw new Error("上传文件到对象存储失败。")
          }

          const metadata = await readUploadMetadata(currentConfig.kind, file)
          const completeResponse = await fetch("/api/uploads/complete", {
            body: JSON.stringify({
              assetId: presignPayload.asset.assetId,
              documentId,
              fileName: file.name,
              ...metadata,
            }),
            headers: {
              "Content-Type": "application/json",
            },
            method: "POST",
          })

          if (!completeResponse.ok) {
            throw new Error(await readResponseMessage(completeResponse))
          }

          const completePayload =
            (await completeResponse.json()) as CompleteResponse

          editor.tf.insertNodes(
            createMediaNode(nodeType, completePayload.asset)
          )
          editor.tf.focus()
        } catch (error) {
          toast.error(
            error instanceof Error ? error.message : "上传失败，请稍后重试。"
          )
        }
      }
    },
    [currentConfig?.kind, documentId, editor, nodeType]
  )

  const { openFilePicker } = useFilePicker({
    accept: currentConfig?.accept ?? [],
    multiple: true,
    onFilesSelected: ({ plainFiles }) => {
      void uploadFiles(plainFiles)
    },
  })

  if (!currentConfig) {
    return null
  }

  if (currentConfig.supportsUrl) {
    return (
      <>
        <ToolbarButton
          {...props}
          tooltip={currentConfig.tooltip}
          onClick={() => setDialogOpen(true)}
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          {currentConfig.icon}
        </ToolbarButton>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent className="gap-6">
            <MediaUrlDialogContent
              nodeType={nodeType}
              setOpen={setDialogOpen}
              title={currentConfig.title}
            />
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <ToolbarButton
      {...props}
      tooltip={currentConfig.tooltip}
      onClick={() => {
        openFilePicker()
      }}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
    >
      {currentConfig.icon}
    </ToolbarButton>
  )
}

function MediaUrlDialogContent({
  nodeType,
  setOpen,
  title,
}: {
  nodeType: string
  setOpen: (value: boolean) => void
  title: string
}) {
  const editor = useEditorRef()
  const [url, setUrl] = React.useState("")

  const insertEmbed = React.useCallback(() => {
    const nextUrl = url.trim()

    if (!isUrl(nextUrl)) {
      toast.error("请输入有效的外链地址。")
      return
    }

    setOpen(false)
    editor.tf.insertNodes({
      children: [{ text: "" }],
      type: nodeType,
      url: nextUrl,
    })
    editor.tf.focus()
  }, [editor, nodeType, setOpen, url])

  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
      </AlertDialogHeader>

      <AlertDialogDescription className="group relative w-full">
        <label
          className="absolute top-1/2 block -translate-y-1/2 cursor-text px-1 text-sm text-muted-foreground/70 transition-all group-focus-within:pointer-events-none group-focus-within:top-0 group-focus-within:cursor-default group-focus-within:text-xs group-focus-within:font-medium group-focus-within:text-foreground has-[+input:not(:placeholder-shown)]:pointer-events-none has-[+input:not(:placeholder-shown)]:top-0 has-[+input:not(:placeholder-shown)]:cursor-default has-[+input:not(:placeholder-shown)]:text-xs has-[+input:not(:placeholder-shown)]:font-medium has-[+input:not(:placeholder-shown)]:text-foreground"
          htmlFor="media-embed-url"
        >
          <span className="inline-flex bg-background px-2">URL</span>
        </label>
        <Input
          autoFocus
          id="media-embed-url"
          placeholder=""
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              insertEmbed()
            }
          }}
        />
      </AlertDialogDescription>

      <AlertDialogFooter>
        <AlertDialogCancel>取消</AlertDialogCancel>
        <AlertDialogAction
          onClick={(event) => {
            event.preventDefault()
            insertEmbed()
          }}
        >
          插入
        </AlertDialogAction>
      </AlertDialogFooter>
    </>
  )
}
