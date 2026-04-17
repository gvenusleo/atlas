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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"

type NodeNameDialogProps = {
  confirmLabel: string
  defaultValue?: string
  description: string
  open: boolean
  placeholder: string
  title: string
  onOpenChange: (open: boolean) => void
  onSubmit: (value: string) => Promise<void>
}

export function NodeNameDialog({
  confirmLabel,
  defaultValue = "",
  description,
  open,
  placeholder,
  title,
  onOpenChange,
  onSubmit,
}: NodeNameDialogProps) {
  const [value, setValue] = React.useState(defaultValue)
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setValue(defaultValue)
      setError(null)
      setIsSubmitting(false)
    }
  }, [defaultValue, open])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      await onSubmit(value)
      onOpenChange(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "操作未完成，请稍后重试。")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="node-name">{title}</FieldLabel>
              <Input
                id="node-name"
                autoFocus
                disabled={isSubmitting}
                placeholder={placeholder}
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </Field>
          </FieldGroup>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner data-icon="inline-start" /> : null}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
