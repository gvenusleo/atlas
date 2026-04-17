"use client"

import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type DeleteNodeDialogProps = {
  description: string
  open: boolean
  title: string
  onDelete: () => Promise<void>
  onOpenChange: (open: boolean) => void
}

export function DeleteNodeDialog({
  description,
  open,
  title,
  onDelete,
  onOpenChange,
}: DeleteNodeDialogProps) {
  const [error, setError] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setError(null)
      setIsDeleting(false)
    }
  }, [open])

  async function handleDelete() {
    setIsDeleting(true)
    setError(null)

    try {
      await onDelete()
      onOpenChange(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "删除失败，请稍后重试。")
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={() => {
              void handleDelete()
            }}
          >
            {isDeleting ? <Spinner data-icon="inline-start" /> : null}
            移入回收站
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
