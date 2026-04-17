"use client"

import * as React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRightIcon, FolderPlusIcon, SparklesIcon } from "lucide-react"

import { NodeNameDialog } from "@/components/document-tree/node-name-dialog"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

function formatRecentTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

export function DocumentsEmptyState() {
  const router = useRouter()
  const { createDocumentInFolder, createFolderInParent, recentDocuments } =
    useDocumentsWorkspace()
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)

  return (
    <>
      <div className="relative flex min-h-svh flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">文档管理面板</span>
              <span className="text-xs text-muted-foreground">
                从左侧组织结构，在右侧进入写作。
              </span>
            </div>
          </div>
        </header>

        <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10 sm:px-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--atlas-glow)_18%,transparent),transparent_65%)]"
          />
          <div className="grid w-full max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="flex items-center">
              <Empty className="min-h-[380px] justify-center border border-border/60 bg-background/70 backdrop-blur-sm">
                <EmptyHeader className="max-w-md gap-3">
                  <EmptyMedia variant="icon">
                    <SparklesIcon />
                  </EmptyMedia>
                  <EmptyTitle className="font-heading text-3xl text-foreground sm:text-4xl">
                    把文档放回一个干净的工作面
                  </EmptyTitle>
                  <EmptyDescription className="text-sm leading-7 sm:text-base">
                    首页只负责管理和进入。创建一篇新文档，或先在左侧建立文件夹结构。
                  </EmptyDescription>
                </EmptyHeader>

                <EmptyContent className="max-w-md gap-3">
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => {
                      void createDocumentInFolder(null).then((document) => {
                        router.push(`/documents/${document.id}`)
                      })
                    }}
                  >
                    <ArrowRightIcon data-icon="inline-start" />
                    新建文档并开始编辑
                  </Button>
                  <Button
                    className="w-full sm:w-auto"
                    variant="ghost"
                    onClick={() => setCreateFolderOpen(true)}
                  >
                    <FolderPlusIcon data-icon="inline-start" />
                    先创建一个文件夹
                  </Button>
                </EmptyContent>
              </Empty>
            </section>

            <section className="flex flex-col justify-center gap-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-medium text-foreground">最近编辑</h2>
                <p className="text-sm text-muted-foreground">
                  这里保留你最近回到过的文档入口。
                </p>
              </div>

              <div className="flex flex-col gap-1">
                {recentDocuments.length > 0 ? (
                  recentDocuments.map((document, index) => (
                    <React.Fragment key={document.id}>
                      <Link
                        className="group flex items-center justify-between rounded-xl px-4 py-4 transition-colors hover:bg-muted/60"
                        href={`/documents/${document.id}`}
                      >
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate text-sm font-medium text-foreground">
                            {document.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {document.folderId ? "位于某个文件夹内" : "根目录文档"}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRecentTime(document.updatedAt)}
                        </span>
                      </Link>
                      {index < recentDocuments.length - 1 ? <Separator /> : null}
                    </React.Fragment>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm text-muted-foreground">
                    还没有最近文档记录。创建第一篇文档后，这里会变成你的快捷入口。
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
      </div>

      <NodeNameDialog
        confirmLabel="创建"
        description="文件夹创建后会立即出现在左侧树中。"
        open={createFolderOpen}
        placeholder="输入文件夹名称"
        title="新建文件夹"
        onOpenChange={setCreateFolderOpen}
        onSubmit={(value) => createFolderInParent(null, value).then(() => undefined)}
      />
    </>
  )
}
