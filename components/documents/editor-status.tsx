"use client"

import { cn } from "@/lib/utils"

export type EditorSaveState = "dirty" | "error" | "saved" | "saving"

type EditorStatusProps = {
  className?: string
  status: EditorSaveState
}

const toneMap: Record<
  EditorSaveState,
  {
    dot: string
    label: string
  }
> = {
  dirty: {
    dot: "bg-amber-500",
    label: "未保存更改",
  },
  error: {
    dot: "bg-destructive",
    label: "保存失败",
  },
  saved: {
    dot: "bg-emerald-500",
    label: "已保存",
  },
  saving: {
    dot: "bg-sky-500",
    label: "保存中",
  },
}

export function EditorStatus({ className, status }: EditorStatusProps) {
  const tone = toneMap[status]

  return (
    <div
      aria-label={tone.label}
      role="status"
      title={tone.label}
      className={cn(
        "inline-flex size-3 items-center justify-center rounded-full",
        className
      )}
    >
      <span className="sr-only">{tone.label}</span>
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full transition-colors",
          tone.dot,
          status === "saving" ? "animate-pulse" : ""
        )}
      />
    </div>
  )
}
