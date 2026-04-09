import { SessionRefresh } from "@/app/_components/session-refresh";
import { requireSession } from "@/lib/auth/service";
import { listDocumentTree } from "@/lib/documents/service";
import { WorkspaceShell } from "./_components/workspace-shell";

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const documentTree = await listDocumentTree(session.user.id);

  return (
    <>
      <SessionRefresh />
      <WorkspaceShell documentTree={documentTree} session={session}>
        {children}
      </WorkspaceShell>
    </>
  );
}
