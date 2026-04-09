import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/service";
import {
  getDocumentByIdForUser,
  getDocumentRevisions,
} from "@/lib/documents/service";
import { DocumentEditorShell } from "../../_components/document-editor-shell";

type DocumentPageProps = {
  params: Promise<{
    documentId: string;
  }>;
};

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await requireSession();
  const { documentId } = await params;
  const [document, revisions] = await Promise.all([
    getDocumentByIdForUser(session.user.id, documentId),
    getDocumentRevisions(session.user.id, documentId),
  ]);

  if (!document) {
    notFound();
  }

  return <DocumentEditorShell document={document} revisions={revisions} />;
}
