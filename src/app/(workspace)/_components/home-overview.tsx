"use client";

import { Clock3Icon, FilePlus2Icon, FileTextIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { DocumentSummary } from "@/lib/documents/types";
import { createDocumentAction } from "../actions";

type HomeOverviewProps = {
  recentDocuments: DocumentSummary[];
};

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function HomeOverview({ recentDocuments }: HomeOverviewProps) {
  const router = useRouter();
  const [isCreating, setCreating] = useState(false);

  const handleCreateDocument = async () => {
    setCreating(true);
    const result = await createDocumentAction(null);
    setCreating(false);

    if (!result.ok) {
      toast.error("创建文档失败", {
        description: result.message,
      });
      return;
    }

    router.push(`/documents/${result.documentId}`);
    router.refresh();
  };

  return (
    <section className="flex flex-1 flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-b pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Workspace
            </p>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Atlas 工作台
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                在这里管理你的 Markdown 文档、编辑历史和即时渲染内容。
              </p>
            </div>
          </div>
          <Button
            disabled={isCreating}
            onClick={() => void handleCreateDocument()}
          >
            <FilePlus2Icon data-icon="inline-start" />
            {isCreating ? "创建中" : "新建文档"}
          </Button>
        </div>
      </header>

      {recentDocuments.length === 0 ? (
        <Empty className="min-h-[420px] border border-dashed bg-background px-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileTextIcon />
            </EmptyMedia>
            <EmptyTitle>从第一篇文档开始</EmptyTitle>
            <EmptyDescription>
              新建后会直接进入编辑页，并自动保存 Markdown 内容和历史快照。
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              disabled={isCreating}
              onClick={() => void handleCreateDocument()}
            >
              <FilePlus2Icon data-icon="inline-start" />
              {isCreating ? "创建中" : "新建第一篇文档"}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-medium text-foreground">最近文档</h2>
              <p className="text-sm text-muted-foreground">
                按最近编辑时间排序
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {recentDocuments.length} 篇
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {recentDocuments.map((document) => (
              <Button
                key={document.id}
                className="h-auto min-h-28 justify-start px-4 py-4"
                variant="outline"
                onClick={() => router.push(`/documents/${document.id}`)}
              >
                <div className="flex w-full items-start gap-3 text-left">
                  <div className="flex size-8 shrink-0 items-center justify-center border bg-muted">
                    <FileTextIcon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="truncate text-sm font-medium text-foreground">
                      {document.title}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3Icon className="size-3.5" />
                      <span>{formatUpdatedAt(document.lastEditedAt)}</span>
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
