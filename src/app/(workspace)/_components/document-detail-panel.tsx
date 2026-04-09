"use client";

import { Button, ScrollShadow, Tabs } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import type { DocumentRevisionItem } from "@/lib/documents/types";
import { HistoryIcon, RefreshIcon, StructureIcon } from "./icons";

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
    <div className="flex h-full min-h-0 flex-col">
      <div className="space-y-1 pb-4">
        <h2 className="text-base font-semibold text-foreground">文档详情</h2>
        <p className="text-sm text-muted">查看结构与版本</p>
      </div>

      <Tabs
        className="flex min-h-0 flex-1 flex-col"
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(String(key))}
      >
        <Tabs.ListContainer className="pb-3">
          <Tabs.List aria-label="文档详情标签">
            <Tabs.Tab id="outline">
              <StructureIcon className="size-4" />
              大纲
            </Tabs.Tab>
            <Tabs.Tab id="history">
              <HistoryIcon className="size-4" />
              历史
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel className="min-h-0 flex-1 pt-1" id="outline">
          <ScrollShadow className="h-full pr-1" hideScrollBar size={36}>
            <div className="min-h-full text-sm">
              <div ref={outlineRef} />
              {isOutlineEmpty ? (
                <p className="py-2 leading-6 text-sm text-muted">
                  当前文档还没有可显示的大纲。
                </p>
              ) : null}
            </div>
          </ScrollShadow>
        </Tabs.Panel>

        <Tabs.Panel className="min-h-0 flex-1 pt-1" id="history">
          <ScrollShadow className="h-full pr-1" hideScrollBar size={36}>
            <div className="space-y-4">
              {revisions.length > 0 ? (
                revisions.map((revision) => (
                  <div
                    key={revision.id}
                    className="border-b border-black/5 pb-4 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {revision.titleSnapshot}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {getRevisionSourceLabel(revision.source)} ·{" "}
                      {formatRevisionTime(revision.createdAt)}
                    </p>
                    <div className="mt-3">
                      <Button
                        isPending={restorePendingRevisionId === revision.id}
                        size="sm"
                        variant="secondary"
                        onPress={() => onRestoreRevision(revision.id)}
                      >
                        <RefreshIcon className="size-4" />
                        恢复到此版本
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">当前文档还没有历史版本。</p>
              )}
            </div>
          </ScrollShadow>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}
