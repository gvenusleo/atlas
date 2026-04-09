import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { documentNodes, documentRevisions } from "@/lib/db/schema";
import type {
  DocumentEditorPayload,
  DocumentNodeKind,
  DocumentRevisionItem,
  DocumentRevisionSource,
  DocumentSummary,
  DocumentTreeItem,
  SaveDocumentDraftInput,
  SaveDocumentDraftResult,
} from "./types";
import {
  DEFAULT_DOCUMENT_TITLE,
  DEFAULT_FOLDER_TITLE,
  DOCUMENT_TITLE_MAX_LENGTH,
} from "./types";

type DocumentNodeRecord = {
  contentMarkdown: string | null;
  id: string;
  kind: DocumentNodeKind;
  lastEditedAt: Date;
  parentId: string | null;
  title: string;
  updatedAt: Date;
};

type DocumentRevisionRecord = {
  createdAt: Date;
  id: string;
  source: DocumentRevisionSource;
  titleSnapshot: string;
};

function compareTreeItems(a: DocumentTreeItem, b: DocumentTreeItem) {
  if (a.kind !== b.kind) {
    return a.kind === "folder" ? -1 : 1;
  }

  return a.title.localeCompare(b.title, "zh-CN");
}

function sortTree(items: DocumentTreeItem[]) {
  items.sort(compareTreeItems);

  for (const item of items) {
    if (item.children.length > 0) {
      sortTree(item.children);
    }
  }

  return items;
}

function serializeTreeItem(
  row: Pick<
    DocumentNodeRecord,
    "id" | "kind" | "parentId" | "title" | "updatedAt"
  >,
): DocumentTreeItem {
  return {
    children: [],
    id: row.id,
    kind: row.kind,
    parentId: row.parentId,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeSummary(
  row: Pick<DocumentNodeRecord, "id" | "lastEditedAt" | "title" | "updatedAt">,
): DocumentSummary {
  return {
    id: row.id,
    lastEditedAt: row.lastEditedAt.toISOString(),
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeRevision(
  row: Pick<
    DocumentRevisionRecord,
    "createdAt" | "id" | "source" | "titleSnapshot"
  >,
): DocumentRevisionItem {
  return {
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    source: row.source,
    titleSnapshot: row.titleSnapshot,
  };
}

function buildEditorPayload(
  document: Pick<
    DocumentNodeRecord,
    "contentMarkdown" | "id" | "title" | "updatedAt"
  >,
  revisionCount: number,
): DocumentEditorPayload {
  return {
    contentMarkdown: document.contentMarkdown ?? "",
    id: document.id,
    revisionCount,
    title: document.title,
    updatedAt: document.updatedAt.toISOString(),
  };
}

function normalizeDocumentTitle(title: string) {
  const normalizedTitle = title.trim() || DEFAULT_DOCUMENT_TITLE;

  if (normalizedTitle.length > DOCUMENT_TITLE_MAX_LENGTH) {
    throw new Error(`文档标题不能超过 ${DOCUMENT_TITLE_MAX_LENGTH} 个字符。`);
  }

  return normalizedTitle;
}

function normalizeFolderTitle(title: string) {
  const normalizedTitle = title.trim() || DEFAULT_FOLDER_TITLE;

  if (normalizedTitle.length > DOCUMENT_TITLE_MAX_LENGTH) {
    throw new Error(`文件夹标题不能超过 ${DOCUMENT_TITLE_MAX_LENGTH} 个字符。`);
  }

  return normalizedTitle;
}

async function getNodeForUser(userId: string, nodeId: string) {
  const db = getDb();
  const [node] = await db
    .select({
      contentMarkdown: documentNodes.contentMarkdown,
      id: documentNodes.id,
      kind: documentNodes.kind,
      lastEditedAt: documentNodes.lastEditedAt,
      parentId: documentNodes.parentId,
      title: documentNodes.title,
      updatedAt: documentNodes.updatedAt,
    })
    .from(documentNodes)
    .where(and(eq(documentNodes.id, nodeId), eq(documentNodes.userId, userId)))
    .limit(1);

  return node satisfies DocumentNodeRecord | undefined;
}

async function ensureParentFolder(userId: string, parentId: string | null) {
  if (!parentId) {
    return null;
  }

  const parent = await getNodeForUser(userId, parentId);

  if (!parent) {
    throw new Error("目标目录不存在。");
  }

  if (parent.kind !== "folder") {
    throw new Error("只能在文件夹内创建内容。");
  }

  return parent;
}

export async function listDocumentTree(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      id: documentNodes.id,
      kind: documentNodes.kind,
      parentId: documentNodes.parentId,
      title: documentNodes.title,
      updatedAt: documentNodes.updatedAt,
    })
    .from(documentNodes)
    .where(eq(documentNodes.userId, userId));

  const itemMap = new Map<string, DocumentTreeItem>();
  const roots: DocumentTreeItem[] = [];

  for (const row of rows) {
    itemMap.set(row.id, serializeTreeItem(row));
  }

  for (const row of rows) {
    const item = itemMap.get(row.id);

    if (!item) {
      continue;
    }

    if (row.parentId) {
      const parent = itemMap.get(row.parentId);

      if (parent) {
        parent.children.push(item);
        continue;
      }
    }

    roots.push(item);
  }

  return sortTree(roots);
}

export async function listRecentDocuments(userId: string, limit = 8) {
  const db = getDb();
  const rows = await db
    .select({
      id: documentNodes.id,
      lastEditedAt: documentNodes.lastEditedAt,
      title: documentNodes.title,
      updatedAt: documentNodes.updatedAt,
    })
    .from(documentNodes)
    .where(
      and(eq(documentNodes.userId, userId), eq(documentNodes.kind, "document")),
    )
    .orderBy(desc(documentNodes.lastEditedAt), desc(documentNodes.updatedAt))
    .limit(limit);

  return rows.map((row) => serializeSummary(row));
}

export async function getDocumentByIdForUser(
  userId: string,
  documentId: string,
) {
  const db = getDb();
  const [document, revisionCountRow] = await Promise.all([
    db
      .select({
        contentMarkdown: documentNodes.contentMarkdown,
        id: documentNodes.id,
        title: documentNodes.title,
        updatedAt: documentNodes.updatedAt,
      })
      .from(documentNodes)
      .where(
        and(
          eq(documentNodes.id, documentId),
          eq(documentNodes.userId, userId),
          eq(documentNodes.kind, "document"),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(documentRevisions)
      .where(
        and(
          eq(documentRevisions.documentId, documentId),
          eq(documentRevisions.userId, userId),
        ),
      )
      .then((rows) => rows[0]),
  ]);

  if (!document) {
    return null;
  }

  return buildEditorPayload(document, Number(revisionCountRow?.count ?? 0));
}

export async function getDocumentRevisions(
  userId: string,
  documentId: string,
  limit = 20,
) {
  const db = getDb();
  const rows = await db
    .select({
      createdAt: documentRevisions.createdAt,
      id: documentRevisions.id,
      source: documentRevisions.source,
      titleSnapshot: documentRevisions.titleSnapshot,
    })
    .from(documentRevisions)
    .where(
      and(
        eq(documentRevisions.documentId, documentId),
        eq(documentRevisions.userId, userId),
      ),
    )
    .orderBy(desc(documentRevisions.createdAt))
    .limit(limit);

  return rows.map((row) => serializeRevision(row));
}

export async function createDocument(userId: string, parentId: string | null) {
  await ensureParentFolder(userId, parentId);

  const db = getDb();
  const now = new Date();
  const documentId = randomUUID();
  const title = DEFAULT_DOCUMENT_TITLE;

  await db.transaction(async (tx) => {
    await tx.insert(documentNodes).values({
      contentMarkdown: "",
      createdAt: now,
      id: documentId,
      kind: "document",
      lastEditedAt: now,
      parentId,
      title,
      updatedAt: now,
      userId,
    });

    await tx.insert(documentRevisions).values({
      contentMarkdownSnapshot: "",
      createdAt: now,
      documentId,
      id: randomUUID(),
      source: "initial",
      titleSnapshot: title,
      userId,
    });
  });

  return {
    documentId,
    item: serializeTreeItem({
      id: documentId,
      kind: "document",
      parentId,
      title,
      updatedAt: now,
    }),
  };
}

export async function createFolder(
  userId: string,
  parentId: string | null,
  title = "",
) {
  await ensureParentFolder(userId, parentId);

  const db = getDb();
  const now = new Date();
  const normalizedTitle = normalizeFolderTitle(title);
  const folderId = randomUUID();

  await db.insert(documentNodes).values({
    contentMarkdown: null,
    createdAt: now,
    id: folderId,
    kind: "folder",
    lastEditedAt: now,
    parentId,
    title: normalizedTitle,
    updatedAt: now,
    userId,
  });

  return {
    folderId,
    item: serializeTreeItem({
      id: folderId,
      kind: "folder",
      parentId,
      title: normalizedTitle,
      updatedAt: now,
    }),
  };
}

export async function renameNode(
  userId: string,
  nodeId: string,
  title: string,
) {
  const currentNode = await getNodeForUser(userId, nodeId);

  if (!currentNode) {
    throw new Error("目标内容不存在。");
  }

  const normalizedTitle =
    currentNode.kind === "folder"
      ? normalizeFolderTitle(title)
      : normalizeDocumentTitle(title);
  const now = new Date();
  const db = getDb();

  await db
    .update(documentNodes)
    .set({
      lastEditedAt:
        currentNode.kind === "document" ? now : currentNode.lastEditedAt,
      title: normalizedTitle,
      updatedAt: now,
    })
    .where(eq(documentNodes.id, nodeId));

  return serializeTreeItem({
    id: currentNode.id,
    kind: currentNode.kind,
    parentId: currentNode.parentId,
    title: normalizedTitle,
    updatedAt: now,
  });
}

export async function deleteNode(userId: string, nodeId: string) {
  const currentNode = await getNodeForUser(userId, nodeId);

  if (!currentNode) {
    throw new Error("目标内容不存在。");
  }

  const db = getDb();
  await db.delete(documentNodes).where(eq(documentNodes.id, nodeId));

  return {
    id: currentNode.id,
    kind: currentNode.kind,
  };
}

export async function saveDocumentDraft(
  userId: string,
  input: SaveDocumentDraftInput,
): Promise<SaveDocumentDraftResult> {
  const currentDocument = await getNodeForUser(userId, input.documentId);

  if (!currentDocument || currentDocument.kind !== "document") {
    return {
      message: "文档不存在或你没有权限访问。",
      ok: false,
    };
  }

  const normalizedTitle = normalizeDocumentTitle(input.title);
  const normalizedContent = input.contentMarkdown;
  const hasChanged =
    currentDocument.title !== normalizedTitle ||
    (currentDocument.contentMarkdown ?? "") !== normalizedContent;

  if (!hasChanged) {
    return {
      latestRevision: null,
      normalizedTitle,
      ok: true,
      revisionCreated: false,
      updatedAt: currentDocument.updatedAt.toISOString(),
    };
  }

  const now = new Date();
  let latestRevision: DocumentRevisionItem | null = null;
  let revisionCreated = false;
  const db = getDb();

  await db.transaction(async (tx) => {
    await tx
      .update(documentNodes)
      .set({
        contentMarkdown: normalizedContent,
        lastEditedAt: now,
        title: normalizedTitle,
        updatedAt: now,
      })
      .where(eq(documentNodes.id, currentDocument.id));

    if (!input.createRevision) {
      return;
    }

    const [previousRevision] = await tx
      .select({
        contentMarkdownSnapshot: documentRevisions.contentMarkdownSnapshot,
        titleSnapshot: documentRevisions.titleSnapshot,
      })
      .from(documentRevisions)
      .where(eq(documentRevisions.documentId, currentDocument.id))
      .orderBy(desc(documentRevisions.createdAt))
      .limit(1);

    if (
      previousRevision &&
      previousRevision.titleSnapshot === normalizedTitle &&
      previousRevision.contentMarkdownSnapshot === normalizedContent
    ) {
      return;
    }

    const revisionId = randomUUID();

    await tx.insert(documentRevisions).values({
      contentMarkdownSnapshot: normalizedContent,
      createdAt: now,
      documentId: currentDocument.id,
      id: revisionId,
      source: "autosave",
      titleSnapshot: normalizedTitle,
      userId,
    });

    latestRevision = serializeRevision({
      createdAt: now,
      id: revisionId,
      source: "autosave",
      titleSnapshot: normalizedTitle,
    });
    revisionCreated = true;
  });

  return {
    latestRevision,
    normalizedTitle,
    ok: true,
    revisionCreated,
    updatedAt: now.toISOString(),
  };
}

export async function restoreDocumentRevision(
  userId: string,
  documentId: string,
  revisionId: string,
) {
  const db = getDb();
  const [document, revision] = await Promise.all([
    getNodeForUser(userId, documentId),
    db
      .select({
        contentMarkdownSnapshot: documentRevisions.contentMarkdownSnapshot,
        createdAt: documentRevisions.createdAt,
        id: documentRevisions.id,
        source: documentRevisions.source,
        titleSnapshot: documentRevisions.titleSnapshot,
      })
      .from(documentRevisions)
      .where(
        and(
          eq(documentRevisions.id, revisionId),
          eq(documentRevisions.documentId, documentId),
          eq(documentRevisions.userId, userId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0]),
  ]);

  if (!document || document.kind !== "document" || !revision) {
    throw new Error("目标版本不存在。");
  }

  const now = new Date();
  const restoreRevisionId = randomUUID();

  await db.transaction(async (tx) => {
    await tx
      .update(documentNodes)
      .set({
        contentMarkdown: revision.contentMarkdownSnapshot,
        lastEditedAt: now,
        title: revision.titleSnapshot,
        updatedAt: now,
      })
      .where(eq(documentNodes.id, documentId));

    await tx.insert(documentRevisions).values({
      contentMarkdownSnapshot: revision.contentMarkdownSnapshot,
      createdAt: now,
      documentId,
      id: restoreRevisionId,
      source: "restore",
      titleSnapshot: revision.titleSnapshot,
      userId,
    });
  });

  const [revisionCountRow] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(documentRevisions)
    .where(
      and(
        eq(documentRevisions.documentId, documentId),
        eq(documentRevisions.userId, userId),
      ),
    );

  return {
    document: buildEditorPayload(
      {
        contentMarkdown: revision.contentMarkdownSnapshot,
        id: documentId,
        title: revision.titleSnapshot,
        updatedAt: now,
      },
      Number(revisionCountRow?.count ?? 0),
    ),
    revision: serializeRevision({
      createdAt: now,
      id: restoreRevisionId,
      source: "restore",
      titleSnapshot: revision.titleSnapshot,
    }),
  };
}
