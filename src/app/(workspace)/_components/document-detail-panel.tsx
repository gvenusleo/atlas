"use client";

import { HistoryIcon, ListTreeIcon, RotateCcwIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentRevisionItem } from "@/lib/documents/types";

type DocumentDetailPanelProps = {
  onRenderOutline: (target: HTMLElement) => void;
  onRestoreRevision: (revisionId: string) => void;
  restorePendingRevisionId: string | null;
  revisions: DocumentRevisionItem[];
};

function formatRevisionTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getRevisionSourceLabel(source: DocumentRevisionItem["source"]) {
  if (source === "initial") {
    return "初始版本";
  }

  if (source === "restore") {
    return "恢复版本";
  }

  return "自动快照";
}

export function DocumentDetailPanel({
  onRenderOutline,
  onRestoreRevision,
  restorePendingRevisionId,
  revisions,
}: DocumentDetailPanelProps) {
  const [selectedTab, setSelectedTab] = useState("outline");
  const [isOutlineEmpty, setOutlineEmpty] = useState(false);
  const outlineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedTab !== "outline" || !outlineRef.current) {
      return;
    }

    onRenderOutline(outlineRef.current);
    setOutlineEmpty(!outlineRef.current.textContent?.trim());
  }, [onRenderOutline, selectedTab]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="space-y-1">
        <h2 className="text-sm font-medium text-foreground">文档详情</h2>
        <p className="text-xs text-muted-foreground">大纲与历史版本</p>
      </div>

      <Tabs
        className="min-h-0 flex-1"
        onValueChange={(value) => setSelectedTab(String(value))}
        value={selectedTab}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="outline">
            <ListTreeIcon data-icon="inline-start" />
            大纲
          </TabsTrigger>
          <TabsTrigger value="history">
            <HistoryIcon data-icon="inline-start" />
            历史
          </TabsTrigger>
        </TabsList>

        <TabsContent className="mt-4 min-h-0 flex-1" value="outline">
          <ScrollArea className="h-full pr-3">
            <div className="atlas-outline min-h-full text-sm">
              <div ref={outlineRef} />
              {isOutlineEmpty ? (
                <Empty className="min-h-[220px] border border-dashed px-4">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ListTreeIcon />
                    </EmptyMedia>
                    <EmptyTitle>暂无大纲</EmptyTitle>
                    <EmptyDescription>
                      添加标题后会自动生成当前文档结构。
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent className="mt-4 min-h-0 flex-1" value="history">
          <ScrollArea className="h-full pr-3">
            {revisions.length > 0 ? (
              <div className="space-y-4">
                {revisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="space-y-3 border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {revision.titleSnapshot}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRevisionSourceLabel(revision.source)} ·{" "}
                        {formatRevisionTime(revision.createdAt)}
                      </p>
                    </div>
                    <Button
                      disabled={restorePendingRevisionId === revision.id}
                      size="sm"
                      variant="outline"
                      onClick={() => onRestoreRevision(revision.id)}
                    >
                      <RotateCcwIcon data-icon="inline-start" />
                      {restorePendingRevisionId === revision.id
                        ? "恢复中"
                        : "恢复到此版本"}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Empty className="min-h-[220px] border border-dashed px-4">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <HistoryIcon />
                  </EmptyMedia>
                  <EmptyTitle>暂无历史版本</EmptyTitle>
                  <EmptyDescription>
                    自动保存达到快照条件后会显示在这里。
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
