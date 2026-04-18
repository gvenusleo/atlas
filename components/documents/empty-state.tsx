"use client"

import Link from "next/link"
import * as React from "react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"

function formatRecentTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
  }).format(new Date(value))
}

export function DocumentsEmptyState() {
  const { recentDocuments } = useDocumentsWorkspace()

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border/60 bg-background px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <span className="text-sm font-medium text-foreground">最近编辑</span>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {recentDocuments.length > 0 ? (
            <div className="flex flex-col">
              {recentDocuments.map((document, index) => (
                <React.Fragment key={document.id}>
                  <Link
                    className="group flex items-center justify-between gap-4 rounded-xl px-3 py-4 transition-colors hover:bg-muted/60"
                    href={`/documents/${document.id}`}
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-sm font-medium text-foreground">
                        {document.title}
                      </span>
                      <span className="truncate text-xs text-muted-foreground">
                        {document.folderId ? "位于文件夹中" : "根目录文档"}
                      </span>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRecentTime(document.updatedAt)}
                    </span>
                  </Link>
                  {index < recentDocuments.length - 1 ? <Separator /> : null}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/80 px-4 text-sm text-muted-foreground">
              暂无最近编辑文档
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
