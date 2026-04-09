"use client";

import { CircleAlertIcon, PanelRightIcon, SaveIcon } from "lucide-react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DOCUMENT_REVISION_INTERVAL_MS,
  type DocumentEditorPayload,
  type DocumentRevisionItem,
} from "@/lib/documents/types";
import {
  restoreDocumentRevisionAction,
  saveDocumentDraftAction,
} from "../actions";
import { DocumentDetailPanel } from "./document-detail-panel";
import { VditorEditor, type VditorEditorHandle } from "./vditor-editor";

type DocumentEditorShellProps = {
  document: DocumentEditorPayload;
  revisions: DocumentRevisionItem[];
};

type SaveState = "error" | "saved" | "saving";

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSaveStateLabel(saveState: SaveState) {
  if (saveState === "saving") {
    return "保存中";
  }

  if (saveState === "error") {
    return "保存失败";
  }

  return "已保存";
}

export function DocumentEditorShell({
  document,
  revisions: initialRevisions,
}: DocumentEditorShellProps) {
  const editorRef = useRef<VditorEditorHandle>(null);
  const lastSavedRef = useRef({
    contentMarkdown: document.contentMarkdown,
    title: document.title,
  });
  const latestRevisionAtRef = useRef(
    initialRevisions[0] ? Date.parse(initialRevisions[0].createdAt) : 0,
  );
  const requestSequenceRef = useRef(0);
  const [title, setTitle] = useState(document.title);
  const [contentMarkdown, setContentMarkdown] = useState(
    document.contentMarkdown,
  );
  const [updatedAt, setUpdatedAt] = useState(document.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isEditorReady, setEditorReady] = useState(false);
  const [revisions, setRevisions] = useState(initialRevisions);
  const [restorePendingRevisionId, setRestorePendingRevisionId] = useState<
    string | null
  >(null);
  const [isDesktopDetailOpen, setDesktopDetailOpen] = useState(true);
  const [isMobileDetailOpen, setMobileDetailOpen] = useState(false);

  const persistDraft = useEffectEvent(async (forceRevision: boolean) => {
    const nextSnapshot = {
      contentMarkdown,
      title,
    };

    if (
      nextSnapshot.title === lastSavedRef.current.title &&
      nextSnapshot.contentMarkdown === lastSavedRef.current.contentMarkdown
    ) {
      setSaveState("saved");
      setSaveError(null);
      return true;
    }

    const createRevision =
      forceRevision ||
      Date.now() - latestRevisionAtRef.current >= DOCUMENT_REVISION_INTERVAL_MS;
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    setSaveState("saving");

    const result = await saveDocumentDraftAction({
      contentMarkdown: nextSnapshot.contentMarkdown,
      createRevision,
      documentId: document.id,
      title: nextSnapshot.title,
    });

    if (requestSequenceRef.current !== requestId) {
      return result.ok;
    }

    if (!result.ok) {
      setSaveState("error");
      setSaveError(result.message);
      return false;
    }

    lastSavedRef.current = {
      contentMarkdown: nextSnapshot.contentMarkdown,
      title: result.normalizedTitle,
    };
    setUpdatedAt(result.updatedAt);
    setSaveState("saved");
    setSaveError(null);

    if (result.normalizedTitle !== nextSnapshot.title) {
      setTitle(result.normalizedTitle);
    }

    if (result.revisionCreated && result.latestRevision) {
      const latestRevision = result.latestRevision;
      latestRevisionAtRef.current = Date.parse(latestRevision.createdAt);
      setRevisions((current) => [
        latestRevision,
        ...current.filter((item) => item.id !== latestRevision.id),
      ]);
    }

    return true;
  });

  const flushDraft = useEffectEvent(() => {
    void persistDraft(true);
  });

  useEffect(() => {
    if (!isEditorReady) {
      return;
    }

    if (
      title === lastSavedRef.current.title &&
      contentMarkdown === lastSavedRef.current.contentMarkdown
    ) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      startTransition(() => {
        void persistDraft(false);
      });
    }, 800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [contentMarkdown, isEditorReady, persistDraft, title]);

  useEffect(() => {
    const doc = globalThis.document;
    const win = globalThis.window;

    const handleVisibilityChange = () => {
      if (doc.visibilityState === "hidden") {
        flushDraft();
      }
    };

    const handleWindowBlur = () => {
      flushDraft();
    };

    doc.addEventListener("visibilitychange", handleVisibilityChange);
    win.addEventListener("blur", handleWindowBlur);

    return () => {
      doc.removeEventListener("visibilitychange", handleVisibilityChange);
      win.removeEventListener("blur", handleWindowBlur);
      flushDraft();
    };
  }, [flushDraft]);

  const handleRestoreRevision = async (revisionId: string) => {
    setRestorePendingRevisionId(revisionId);
    const result = await restoreDocumentRevisionAction(document.id, revisionId);
    setRestorePendingRevisionId(null);

    if (!result.ok) {
      setSaveState("error");
      setSaveError(result.message);
      return;
    }

    lastSavedRef.current = {
      contentMarkdown: result.document.contentMarkdown,
      title: result.document.title,
    };
    latestRevisionAtRef.current = Date.parse(result.revision.createdAt);
    setTitle(result.document.title);
    setContentMarkdown(result.document.contentMarkdown);
    setUpdatedAt(result.document.updatedAt);
    setRevisions((current) => [
      result.revision,
      ...current.filter((item) => item.id !== result.revision.id),
    ]);
    setSaveState("saved");
    setSaveError(null);
    editorRef.current?.setValue(result.document.contentMarkdown);
  };

  const openDetailPanel = () => {
    if (window.innerWidth >= 1280) {
      setDesktopDetailOpen((current) => !current);
      return;
    }

    setMobileDetailOpen(true);
  };

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-h-0 flex-1 flex-col gap-6 xl:flex-row xl:items-stretch">
          <section className="flex min-h-0 flex-1">
            <div className="mx-auto flex min-h-0 w-full max-w-[1120px] flex-col gap-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Document
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <SaveIcon className="size-3.5" />
                      {getSaveStateLabel(saveState)}
                    </span>
                    <span>最近更新：{formatUpdatedAt(updatedAt)}</span>
                    <span>历史版本：{revisions.length}</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={openDetailPanel}>
                  <PanelRightIcon data-icon="inline-start" />
                  大纲与历史
                </Button>
              </div>

              <Card className="min-h-0 flex-1">
                <CardHeader className="gap-4 border-b">
                  <div className="space-y-2">
                    <Label htmlFor="document-title">标题</Label>
                    <Input
                      id="document-title"
                      placeholder="无标题文档"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </div>
                </CardHeader>

                <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pb-4">
                  {saveError ? (
                    <Alert variant="destructive">
                      <CircleAlertIcon className="size-4" />
                      <AlertTitle>自动保存失败</AlertTitle>
                      <AlertDescription>{saveError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <div className="min-h-[calc(100dvh-18rem)] flex-1">
                    <VditorEditor
                      ref={editorRef}
                      value={contentMarkdown}
                      onBlur={(nextValue) => {
                        setContentMarkdown(nextValue);
                        flushDraft();
                      }}
                      onChange={(nextValue) => setContentMarkdown(nextValue)}
                      onReady={() => setEditorReady(true)}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {isDesktopDetailOpen ? (
            <aside className="hidden w-full max-w-[320px] xl:flex xl:min-h-0 xl:flex-col xl:border-l xl:pl-6">
              <DocumentDetailPanel
                restorePendingRevisionId={restorePendingRevisionId}
                revisions={revisions}
                onRenderOutline={(target) =>
                  editorRef.current?.renderOutline(target)
                }
                onRestoreRevision={(revisionId) =>
                  void handleRestoreRevision(revisionId)
                }
              />
            </aside>
          ) : null}
        </div>
      </div>

      <Sheet open={isMobileDetailOpen} onOpenChange={setMobileDetailOpen}>
        <SheetContent className="w-full sm:max-w-sm" side="right">
          <SheetHeader>
            <SheetTitle>文档详情</SheetTitle>
            <SheetDescription>查看大纲和历史版本。</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 px-4 pb-4">
            <DocumentDetailPanel
              restorePendingRevisionId={restorePendingRevisionId}
              revisions={revisions}
              onRenderOutline={(target) =>
                editorRef.current?.renderOutline(target)
              }
              onRestoreRevision={(revisionId) =>
                void handleRestoreRevision(revisionId)
              }
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
