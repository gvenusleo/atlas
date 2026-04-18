"use client"

import * as React from "react"

import Link from "next/link"
import {
  BoldIcon,
  CodeIcon,
  DownloadIcon,
  ItalicIcon,
  MoreHorizontalIcon,
  RefreshCwIcon,
  StrikethroughIcon,
  UnderlineIcon,
} from "lucide-react"
import { Plate, usePlateEditor } from "platejs/react"
import { KEYS } from "platejs"
import { MarkdownPlugin } from "@platejs/markdown"
import { toast } from "sonner"

import { atlasEditorKit } from "@/components/documents/atlas-editor-kit"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"
import { EditorStatus } from "@/components/documents/editor-status"
import { Button } from "@/components/ui/button"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Editor, EditorContainer } from "@/components/ui/editor"
import { FixedToolbar } from "@/components/ui/fixed-toolbar"
import { FloatingToolbar } from "@/components/ui/floating-toolbar"
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from "@/components/ui/list-toolbar-button"
import {
  IndentToolbarButton,
  OutdentToolbarButton,
} from "@/components/ui/indent-toolbar-button"
import { InsertToolbarButton } from "@/components/ui/insert-toolbar-button"
import { LinkToolbarButton } from "@/components/ui/link-toolbar-button"
import { MarkToolbarButton } from "@/components/ui/mark-toolbar-button"
import { MediaToolbarButton } from "@/components/ui/media-toolbar-button"
import { MoreToolbarButton } from "@/components/ui/more-toolbar-button"
import { InlineEquationToolbarButton } from "@/components/ui/equation-toolbar-button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { TableToolbarButton } from "@/components/ui/table-toolbar-button"
import { ToolbarGroup } from "@/components/ui/toolbar"
import { TurnIntoToolbarButton } from "@/components/ui/turn-into-toolbar-button"
import {
  RedoToolbarButton,
  UndoToolbarButton,
} from "@/components/ui/history-toolbar-button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMounted } from "@/hooks/use-mounted"
import {
  DOCUMENT_SAVE_DEBOUNCE_MS,
  EMPTY_DOCUMENT_CONTENT,
} from "@/lib/documents/defaults"
import { saveDocumentContent, saveDocumentTitle } from "@/lib/documents/actions"
import { findDocumentBreadcrumbs } from "@/lib/documents/tree"
import type { DocumentContent, SerializedDocument } from "@/lib/documents/types"

type EditorShellProps = {
  document: SerializedDocument
}

type SaveState = "dirty" | "error" | "saved" | "saving"

function normalizeContent(content: DocumentContent): DocumentContent {
  return Array.isArray(content) && content.length > 0
    ? content
    : EMPTY_DOCUMENT_CONTENT
}

type EditorShellFallbackProps = {
  breadcrumbs: ReturnType<typeof findDocumentBreadcrumbs>
  title: string
}

function EditorShellFallback({
  breadcrumbs,
  title,
}: EditorShellFallbackProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">文档</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1

                    return (
                      <React.Fragment key={item.id}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : item.href ? (
                            <BreadcrumbLink asChild>
                              <Link href={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <EditorStatus status="saved" />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl min-w-0 flex-col overflow-hidden">
          <div className="shrink-0 px-6 pt-10 pb-4 sm:px-10">
            <div className="font-heading text-4xl tracking-tight text-foreground">
              {title.trim() || "未命名文档"}
            </div>
          </div>

          <div className="sticky top-0 z-20 shrink-0 border-b border-border/60 bg-background/95 px-2 py-2 backdrop-blur sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-8 w-32 rounded-md" />
              <Skeleton className="h-8 w-18 rounded-md" />
              <Skeleton className="h-8 w-28 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-24 rounded-md" />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-6 pb-24 sm:px-10">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-5 w-full max-w-3xl" />
              <Skeleton className="h-5 w-full max-w-[42rem]" />
              <Skeleton className="h-5 w-full max-w-[36rem]" />
              <Skeleton className="h-5 w-full max-w-[40rem]" />
              <Skeleton className="h-5 w-full max-w-[26rem]" />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export function EditorShell({ document: initialDocument }: EditorShellProps) {
  const mounted = useMounted()
  const editor = usePlateEditor(
    {
      id: `document-${initialDocument.id}`,
      plugins: atlasEditorKit,
      value: normalizeContent(initialDocument.content),
    },
    [initialDocument.id]
  )
  const { applyDocumentMeta, tree } = useDocumentsWorkspace()
  const [title, setTitle] = React.useState(initialDocument.title)
  const [saveState, setSaveState] = React.useState<SaveState>("saved")
  const [saveError, setSaveError] = React.useState<string | null>(null)

  const titleRef = React.useRef(initialDocument.title)
  const contentRef = React.useRef<DocumentContent>(
    normalizeContent(initialDocument.content)
  )
  const contentVersionRef = React.useRef(initialDocument.contentVersion)
  const lastSavedRef = React.useRef({
    content: JSON.stringify(normalizeContent(initialDocument.content)),
    title: initialDocument.title,
  })
  const pendingTimerRef = React.useRef<number | null>(null)
  const pendingAfterSaveRef = React.useRef(false)
  const isSavingRef = React.useRef(false)

  const breadcrumbs = findDocumentBreadcrumbs(tree, initialDocument.id)

  const clearPendingTimer = React.useCallback(() => {
    if (pendingTimerRef.current !== null) {
      window.clearTimeout(pendingTimerRef.current)
      pendingTimerRef.current = null
    }
  }, [])

  const flushSave = React.useCallback(async () => {
    clearPendingTimer()

    if (isSavingRef.current) {
      pendingAfterSaveRef.current = true
      return
    }

    const nextTitle = titleRef.current.trim() || "未命名文档"
    const nextContent = normalizeContent(contentRef.current)
    const serializedContent = JSON.stringify(nextContent)
    const needsTitleSave = nextTitle !== lastSavedRef.current.title
    const needsContentSave = serializedContent !== lastSavedRef.current.content

    if (!needsTitleSave && !needsContentSave) {
      setSaveState("saved")
      setSaveError(null)
      return
    }

    isSavingRef.current = true
    setSaveState("saving")
    setSaveError(null)

    try {
      if (needsTitleSave) {
        const titleResult = await saveDocumentTitle({
          documentId: initialDocument.id,
          title: nextTitle,
        })

        titleRef.current = titleResult.title
        lastSavedRef.current.title = titleResult.title
        setTitle(titleResult.title)
        applyDocumentMeta({
          documentId: initialDocument.id,
          title: titleResult.title,
          updatedAt: titleResult.updatedAt,
        })
      }

      if (needsContentSave) {
        const contentResult = await saveDocumentContent({
          content: nextContent,
          contentVersion: contentVersionRef.current,
          documentId: initialDocument.id,
        })

        if (contentResult.conflict) {
          throw new Error("检测到版本冲突，请刷新页面后重试。")
        }

        contentVersionRef.current = contentResult.contentVersion
        lastSavedRef.current.content = serializedContent
        applyDocumentMeta({
          documentId: initialDocument.id,
          title: titleRef.current,
          updatedAt: contentResult.updatedAt,
        })
      }

      setSaveState("saved")
      setSaveError(null)
    } catch (error) {
      setSaveState("error")
      setSaveError(
        error instanceof Error ? error.message : "保存失败，请稍后重试。"
      )
    } finally {
      isSavingRef.current = false

      if (pendingAfterSaveRef.current) {
        pendingAfterSaveRef.current = false
        void flushSave()
      }
    }
  }, [applyDocumentMeta, clearPendingTimer, initialDocument.id])

  const scheduleSave = React.useCallback(() => {
    clearPendingTimer()

    if (!isSavingRef.current) {
      setSaveState("dirty")
    }

    pendingTimerRef.current = window.setTimeout(() => {
      void flushSave()
    }, DOCUMENT_SAVE_DEBOUNCE_MS)
  }, [clearPendingTimer, flushSave])

  const exportMarkdown = React.useCallback(() => {
    try {
      const markdown = editor.getApi(MarkdownPlugin).markdown.serialize()
      const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" })
      const url = window.URL.createObjectURL(blob)
      const anchor = window.document.createElement("a")

      anchor.href = url
      anchor.download = `${titleRef.current || "未命名文档"}.md`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error("导出 Markdown 失败，请稍后重试。")
    }
  }, [editor])

  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (window.document.visibilityState === "hidden") {
        void flushSave()
      }
    }

    const handleBeforeUnload = () => {
      void flushSave()
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    window.document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      )
      clearPendingTimer()
      void flushSave()
    }
  }, [clearPendingTimer, flushSave])

  if (!mounted) {
    return (
      <EditorShellFallback
        breadcrumbs={breadcrumbs}
        title={initialDocument.title}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <div className="min-w-0">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">文档</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1

                    return (
                      <React.Fragment key={item.id}>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          ) : item.href ? (
                            <BreadcrumbLink asChild>
                              <Link href={item.href}>{item.label}</Link>
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    )
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 md:gap-3">
            <EditorStatus status={saveState} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreHorizontalIcon data-icon />
                  <span className="sr-only">更多操作</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                {saveState === "error" ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      void flushSave()
                    }}
                  >
                    <RefreshCwIcon />
                    重试保存
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  className="whitespace-nowrap"
                  onSelect={() => {
                    exportMarkdown()
                  }}
                >
                  <DownloadIcon />
                  导出 Markdown
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
        onBlurCapture={() => void flushSave()}
      >
        <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl min-w-0 flex-col overflow-hidden">
          <div className="shrink-0 px-6 pt-10 pb-4 sm:px-10">
            <input
              className="w-full border-none bg-transparent font-heading text-4xl tracking-tight text-foreground outline-none placeholder:text-muted-foreground/70"
              placeholder="未命名文档"
              value={title}
              onBlur={() => void flushSave()}
              onChange={(event) => {
                const nextTitle = event.target.value
                titleRef.current = nextTitle
                setTitle(nextTitle)
                scheduleSave()
              }}
            />
            {saveError ? (
              <p className="mt-2 text-sm text-destructive">{saveError}</p>
            ) : null}
          </div>

          <Plate
            editor={editor}
            onValueChange={({ value }) => {
              contentRef.current = normalizeContent(value as DocumentContent)
              scheduleSave()
            }}
          >
            <FixedToolbar className="top-0 shrink-0 min-w-0 max-w-full rounded-none border-x-0 px-2 sm:px-4">
              <div className="flex min-w-max flex-nowrap items-center gap-0 py-1 pr-3">
                <ToolbarGroup>
                  <TurnIntoToolbarButton />
                </ToolbarGroup>

                <ToolbarGroup>
                  <UndoToolbarButton />
                  <RedoToolbarButton />
                </ToolbarGroup>

                <ToolbarGroup>
                  <MarkToolbarButton nodeType={KEYS.bold} tooltip="粗体">
                    <BoldIcon />
                  </MarkToolbarButton>
                  <MarkToolbarButton nodeType={KEYS.italic} tooltip="斜体">
                    <ItalicIcon />
                  </MarkToolbarButton>
                  <MarkToolbarButton
                    nodeType={KEYS.underline}
                    tooltip="下划线"
                  >
                    <UnderlineIcon />
                  </MarkToolbarButton>
                  <MarkToolbarButton
                    className="hidden md:inline-flex"
                    nodeType={KEYS.strikethrough}
                    tooltip="删除线"
                  >
                    <StrikethroughIcon />
                  </MarkToolbarButton>
                  <MarkToolbarButton
                    className="hidden md:inline-flex"
                    nodeType={KEYS.code}
                    tooltip="行内代码"
                  >
                    <CodeIcon />
                  </MarkToolbarButton>
                </ToolbarGroup>

                <ToolbarGroup>
                  <BulletedListToolbarButton />
                  <NumberedListToolbarButton />
                  <TodoListToolbarButton />
                </ToolbarGroup>

                <ToolbarGroup className="hidden xl:flex">
                  <OutdentToolbarButton />
                  <IndentToolbarButton />
                </ToolbarGroup>

                <ToolbarGroup>
                  <LinkToolbarButton />
                  <InlineEquationToolbarButton className="hidden lg:inline-flex" />
                  <div className="hidden md:flex">
                    <TableToolbarButton />
                  </div>
                </ToolbarGroup>

                <ToolbarGroup>
                  <MediaToolbarButton
                    documentId={initialDocument.id}
                    nodeType={KEYS.img}
                  />
                  <MediaToolbarButton
                    className="hidden lg:inline-flex"
                    documentId={initialDocument.id}
                    nodeType={KEYS.video}
                  />
                  <MediaToolbarButton
                    className="hidden lg:inline-flex"
                    documentId={initialDocument.id}
                    nodeType={KEYS.audio}
                  />
                  <MediaToolbarButton
                    className="hidden md:inline-flex"
                    documentId={initialDocument.id}
                    nodeType={KEYS.file}
                  />
                  <MediaToolbarButton
                    className="hidden lg:inline-flex"
                    documentId={initialDocument.id}
                    nodeType={KEYS.mediaEmbed}
                  />
                </ToolbarGroup>

                <ToolbarGroup>
                  <InsertToolbarButton />
                  <MoreToolbarButton />
                </ToolbarGroup>
              </div>
            </FixedToolbar>

            <EditorContainer className="min-h-0 flex-1 overflow-x-hidden">
              <Editor placeholder="开始写作" />
            </EditorContainer>

            <FloatingToolbar>
              <MarkToolbarButton nodeType={KEYS.bold} tooltip="粗体">
                <BoldIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.italic} tooltip="斜体">
                <ItalicIcon />
              </MarkToolbarButton>
              <MarkToolbarButton nodeType={KEYS.underline} tooltip="下划线">
                <UnderlineIcon />
              </MarkToolbarButton>
              <MarkToolbarButton
                nodeType={KEYS.strikethrough}
                tooltip="删除线"
              >
                <StrikethroughIcon />
              </MarkToolbarButton>
              <LinkToolbarButton />
            </FloatingToolbar>
          </Plate>
        </section>
      </main>
    </div>
  )
}
