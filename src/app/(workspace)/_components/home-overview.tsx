"use client";

import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DocumentSummary } from "@/lib/documents/types";
import { createDocumentAction } from "../actions";
import { FileIcon, PlusIcon } from "./icons";

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
      return;
    }

    router.push(`/documents/${result.documentId}`);
    router.refresh();
  };

  if (recentDocuments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-3xl space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted">个人知识空间</p>
            <h1 className="text-3xl font-semibold text-foreground">
              从第一篇 Markdown 开始
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted">
              这里会保存你的文档结构、编辑内容和历史快照，默认支持即时渲染、数学公式、脚注、ToC
              与常见 Markdown 扩展。
            </p>
          </div>
          <Button
            isPending={isCreating}
            onPress={() => void handleCreateDocument()}
          >
            <PlusIcon className="size-4" />
            新建第一篇文档
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      <div className="flex flex-col gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted">个人知识空间</p>
          <h1 className="text-3xl font-semibold text-foreground">
            Atlas 工作台
          </h1>
          <p className="text-sm text-muted">
            从最近文档继续写作，或直接创建一篇新的 Markdown 内容。
          </p>
        </div>
        <Button
          isPending={isCreating}
          onPress={() => void handleCreateDocument()}
        >
          <PlusIcon className="size-4" />
          新建文档
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">最近文档</h2>
            <p className="text-sm text-muted">按最近编辑时间排序</p>
          </div>
          <p className="text-sm text-muted">{recentDocuments.length} 篇文档</p>
        </div>
        <div className="space-y-2">
          {recentDocuments.map((document) => (
            <Button
              key={document.id}
              className="min-h-[72px] justify-start"
              fullWidth
              variant="secondary"
              onPress={() => router.push(`/documents/${document.id}`)}
            >
              <FileIcon className="size-4 shrink-0" />
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate font-medium text-foreground">
                  {document.title}
                </p>
                <p className="text-sm text-muted">
                  最近编辑于 {formatUpdatedAt(document.lastEditedAt)}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
