"use client"

import * as React from "react"

import { upsertLink } from "@platejs/link"
import { Link2Icon } from "lucide-react"
import { isUrl } from "platejs"
import { useEditorRef } from "platejs/react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { ToolbarButton } from "./toolbar"

export function LinkToolbarButton(
  props: React.ComponentProps<typeof ToolbarButton>
) {
  const editor = useEditorRef()
  const [open, setOpen] = React.useState(false)
  const [url, setUrl] = React.useState("")

  const submit = React.useCallback(() => {
    const nextUrl = url.trim()

    if (!nextUrl) {
      return
    }

    if (!isUrl(nextUrl)) {
      toast.error("请输入有效的链接地址。")
      return
    }

    upsertLink(editor, {
      text: editor.api.isCollapsed() ? nextUrl : undefined,
      url: nextUrl,
    })

    setOpen(false)
    setUrl("")
    editor.tf.focus()
  }, [editor, url])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton
          {...props}
          data-plate-focus
          pressed={open}
          tooltip="链接"
          onMouseDown={(event) => {
            event.preventDefault()
          }}
        >
          <Link2Icon />
        </ToolbarButton>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80"
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
      >
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <Input
            autoFocus
            placeholder="https://example.com"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setUrl("")
              }}
            >
              取消
            </Button>
            <Button type="submit">插入链接</Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
