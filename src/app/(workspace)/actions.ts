"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/service";
import {
  createDocument,
  createFolder,
  deleteNode,
  renameNode,
  restoreDocumentRevision,
  saveDocumentDraft,
} from "@/lib/documents/service";
import type { SaveDocumentDraftInput } from "@/lib/documents/types";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "操作未完成，请稍后重试。";
}

function revalidateWorkspace(documentId?: string) {
  revalidatePath("/");

  if (documentId) {
    revalidatePath(`/documents/${documentId}`);
  }
}

export async function createDocumentAction(parentId: string | null = null) {
  try {
    const session = await requireSession();
    const result = await createDocument(session.user.id, parentId);

    revalidateWorkspace(result.documentId);

    return {
      documentId: result.documentId,
      ok: true as const,
    };
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}

export async function createFolderAction(
  parentId: string | null = null,
  title = "",
) {
  try {
    const session = await requireSession();
    const result = await createFolder(session.user.id, parentId, title);

    revalidateWorkspace();

    return {
      folderId: result.folderId,
      ok: true as const,
    };
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}

export async function renameNodeAction(nodeId: string, title: string) {
  try {
    const session = await requireSession();
    const item = await renameNode(session.user.id, nodeId, title);

    revalidateWorkspace(item.kind === "document" ? item.id : undefined);

    return {
      item,
      ok: true as const,
    };
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}

export async function deleteNodeAction(nodeId: string) {
  try {
    const session = await requireSession();
    const result = await deleteNode(session.user.id, nodeId);

    revalidateWorkspace();

    return {
      deletedId: result.id,
      kind: result.kind,
      ok: true as const,
    };
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}

export async function saveDocumentDraftAction(input: SaveDocumentDraftInput) {
  try {
    const session = await requireSession();
    const result = await saveDocumentDraft(session.user.id, input);

    if (result.ok) {
      revalidateWorkspace(input.documentId);
    }

    return result;
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}

export async function restoreDocumentRevisionAction(
  documentId: string,
  revisionId: string,
) {
  try {
    const session = await requireSession();
    const result = await restoreDocumentRevision(
      session.user.id,
      documentId,
      revisionId,
    );

    revalidateWorkspace(documentId);

    return {
      ...result,
      ok: true as const,
    };
  } catch (error) {
    return {
      message: getErrorMessage(error),
      ok: false as const,
    };
  }
}
