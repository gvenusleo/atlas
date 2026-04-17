import { notFound, redirect } from "next/navigation"

import { EditorShell } from "@/components/documents/editor-shell"
import { getSession } from "@/lib/auth-session"
import { getDocumentById } from "@/lib/documents/queries"

type DocumentPageProps = {
  params: Promise<{
    documentId: string
  }>
}

export default async function DocumentPage({ params }: DocumentPageProps) {
  const session = await getSession()

  if (!session?.user.id) {
    redirect("/auth")
  }

  const { documentId } = await params
  const document = await getDocumentById(documentId, session.user.id)

  if (!document) {
    notFound()
  }

  return <EditorShell key={document.id} document={document} />
}
