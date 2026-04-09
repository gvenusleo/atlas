export const documentNodeKinds = ["document", "folder"] as const;
export const documentRevisionSources = [
  "initial",
  "autosave",
  "restore",
] as const;

export type DocumentNodeKind = (typeof documentNodeKinds)[number];
export type DocumentRevisionSource = (typeof documentRevisionSources)[number];

export type DocumentTreeItem = {
  children: DocumentTreeItem[];
  id: string;
  kind: DocumentNodeKind;
  parentId: string | null;
  title: string;
  updatedAt: string;
};

export type DocumentSummary = {
  id: string;
  lastEditedAt: string;
  title: string;
  updatedAt: string;
};

export type DocumentEditorPayload = {
  contentMarkdown: string;
  id: string;
  revisionCount: number;
  title: string;
  updatedAt: string;
};

export type DocumentRevisionItem = {
  createdAt: string;
  id: string;
  source: DocumentRevisionSource;
  titleSnapshot: string;
};

export type SaveDocumentDraftInput = {
  contentMarkdown: string;
  createRevision: boolean;
  documentId: string;
  title: string;
};

export type SaveDocumentDraftResult =
  | {
      latestRevision: DocumentRevisionItem | null;
      normalizedTitle: string;
      ok: true;
      revisionCreated: boolean;
      updatedAt: string;
    }
  | {
      message: string;
      ok: false;
    };

export const DEFAULT_DOCUMENT_TITLE = "未命名文档";
export const DEFAULT_FOLDER_TITLE = "未命名文件夹";
export const DOCUMENT_TITLE_MAX_LENGTH = 120;
export const DOCUMENT_REVISION_INTERVAL_MS = 20_000;
