import type { DocumentContent } from "@/lib/documents/types"

export const DEFAULT_DOCUMENT_TITLE = "未命名文档"
export const DEFAULT_FOLDER_NAME = "新文件夹"
export const DOCUMENT_SAVE_DEBOUNCE_MS = 800
export const RECENT_DOCUMENT_LIMIT = 6

export const EMPTY_DOCUMENT_CONTENT: DocumentContent = [
  {
    type: "p",
    children: [{ text: "" }],
  },
]

export const UPLOAD_LIMITS = {
  audio: 25 * 1024 * 1024,
  file: 25 * 1024 * 1024,
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
} as const

export const UPLOAD_ACCEPTED_TYPES = {
  audio: ["audio/"],
  file: [],
  image: ["image/"],
  video: ["video/"],
} as const
