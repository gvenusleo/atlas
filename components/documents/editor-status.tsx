"use client"

import { CheckCircle2Icon, CloudAlertIcon, LoaderCircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type EditorStatusProps = {
  className?: string
  status: "dirty" | "error" | "saved" | "saving"
}

const statusMap: Record<
  EditorStatusProps["status"],
  {
    icon: React.ComponentType<{ className?: string }>
    label: string
  }
> = {
  dirty: {
    icon: LoaderCircleIcon,
    label: "未保存更改",
  },
  error: {
    icon: CloudAlertIcon,
    label: "保存失败",
  },
  saved: {
    icon: CheckCircle2Icon,
    label: "已保存",
  },
  saving: {
    icon: LoaderCircleIcon,
    label: "保存中",
  },
}

export function EditorStatus({ className, status }: EditorStatusProps) {
  const { icon: Icon, label } = statusMap[status]

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      <Icon className={cn(status === "saving" ? "animate-spin" : "")} />
      <span>{label}</span>
    </div>
  )
}
