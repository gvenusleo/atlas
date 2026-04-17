"use client"

import type { ComponentType } from "react"

import {
  AlertTriangleIcon,
  CheckIcon,
  LoaderCircleIcon,
  PenLineIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

export type EditorSaveState = "dirty" | "error" | "saved" | "saving"

type EditorStatusProps = {
  className?: string
  status: EditorSaveState
}

const statusMap: Record<
  EditorSaveState,
  {
    icon: ComponentType<{ className?: string }>
    label: string
  }
> = {
  dirty: {
    icon: PenLineIcon,
    label: "未保存",
  },
  error: {
    icon: AlertTriangleIcon,
    label: "保存失败",
  },
  saved: {
    icon: CheckIcon,
    label: "已保存",
  },
  saving: {
    icon: LoaderCircleIcon,
    label: "保存中",
  },
}

const toneMap: Record<
  EditorSaveState,
  {
    capsule: string
    icon: string
    label: string
  }
> = {
  dirty: {
    capsule: "border-border/70 bg-background/80 text-foreground/78",
    icon: "text-primary/80",
    label: "text-foreground/82",
  },
  error: {
    capsule: "border-destructive/20 bg-destructive/10 text-destructive",
    icon: "text-destructive",
    label: "text-destructive",
  },
  saved: {
    capsule: "border-border/70 bg-background/82 text-foreground/78",
    icon: "text-foreground/72",
    label: "text-foreground/82",
  },
  saving: {
    capsule: "border-border/70 bg-background/82 text-foreground/78",
    icon: "text-foreground/72",
    label: "text-foreground/82",
  },
}

export function EditorStatus({ className, status }: EditorStatusProps) {
  const { icon: Icon, label } = statusMap[status]
  const tone = toneMap[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 shadow-[0_1px_0_0_color-mix(in_oklch,var(--border)_55%,transparent)] backdrop-blur-sm transition-colors",
        tone.capsule,
        className
      )}
    >
      <Icon
        className={cn(
          "size-3.5 shrink-0",
          tone.icon,
          status === "saving" ? "animate-spin" : ""
        )}
      />
      <span className={cn("text-[12px] font-medium", tone.label)}>{label}</span>
    </div>
  )
}
