import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { DocumentsWorkspaceProvider } from "@/components/documents/documents-workspace-provider"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth-session"
import { getWorkspaceSnapshot } from "@/lib/documents/queries"

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  if (!session) {
    redirect("/auth")
  }

  const workspaceSnapshot = await getWorkspaceSnapshot(session.user.id)

  return (
    <div className="min-h-svh bg-background">
      <DocumentsWorkspaceProvider
        initialRecentDocuments={workspaceSnapshot.recentDocuments}
        initialTree={workspaceSnapshot.tree}
        user={{
          email: session.user.email,
          id: session.user.id,
          image: session.user.image ?? null,
          name: session.user.name,
        }}
      >
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
      </DocumentsWorkspaceProvider>
    </div>
  )
}
