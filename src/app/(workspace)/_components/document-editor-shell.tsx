"use client";

import { Alert, Button, Card, Drawer, Input } from "@heroui/react";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
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
import { PanelRightIcon } from "./icons";
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
  const [isDesktopDetailOpen, setDesktopDetailOpen] = useState(false);
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
      latestRevisionAtRef.current = Date.parse(result.latestRevision.createdAt);
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
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-4 sm:p-6 xl:flex-row xl:gap-8">
        <div className="flex min-h-0 flex-1 xl:pr-2">
          <div className="mx-auto flex min-h-0 w-full max-w-[1100px]">
            <Card className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <Card.Header className="flex-col items-stretch gap-4 border-b border-black/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    <span>
                      {saveState === "saving"
                        ? "保存中"
                        : saveState === "error"
                          ? "保存失败"
                          : "已保存"}
                    </span>
                    <span>最近更新：{formatUpdatedAt(updatedAt)}</span>
                    <span>历史版本：{revisions.length}</span>
                  </div>
                  <Button size="sm" variant="ghost" onPress={openDetailPanel}>
                    <PanelRightIcon className="size-4" />
                    大纲与历史
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted">标题</p>
                  <Input
                    aria-label="文档标题"
                    fullWidth
                    placeholder="无标题文档"
                    value={title}
                    variant="primary"
                    onChange={(event) => setTitle(event.target.value)}
                  />
                </div>
              </Card.Header>

              <Card.Content className="flex min-h-0 flex-1 flex-col gap-4 p-5">
                {saveError ? (
                  <Alert status="danger">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>自动保存失败</Alert.Title>
                      <Alert.Description>{saveError}</Alert.Description>
                    </Alert.Content>
                  </Alert>
                ) : null}

                <div className="min-h-[calc(100dvh-280px)] flex-1">
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
              </Card.Content>
            </Card>
          </div>
        </div>

        {isDesktopDetailOpen ? (
          <div className="hidden w-full max-w-[280px] xl:flex xl:min-h-0 xl:flex-col xl:border-l xl:border-black/5 xl:pl-6">
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
        ) : null}
      </div>

      <Drawer.Backdrop
        isOpen={isMobileDetailOpen}
        onOpenChange={setMobileDetailOpen}
      >
        <Drawer.Content placement="right">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>文档详情</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="p-0">
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
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </>
  );
}
