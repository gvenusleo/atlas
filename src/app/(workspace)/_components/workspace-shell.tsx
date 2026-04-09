"use client";

import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { DocumentTreeItem } from "@/lib/documents/types";
import { WorkspaceSidebar } from "./workspace-sidebar";

type WorkspaceShellProps = {
  children: React.ReactNode;
  documentTree: DocumentTreeItem[];
  session: {
    user: {
      email: string;
      id: string;
      name: string;
    };
  };
};

function getRouteLabel(pathname: string) {
  if (pathname.startsWith("/documents/")) {
    return "文档编辑";
  }

  return "工作台";
}

export function WorkspaceShell({
  children,
  documentTree,
  session,
}: WorkspaceShellProps) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="offcanvas">
        <WorkspaceSidebar documentTree={documentTree} session={session} />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-h-svh bg-muted/30">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="md:hidden" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Atlas</p>
            <p className="truncate text-sm font-medium text-foreground">
              {getRouteLabel(pathname)}
            </p>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
