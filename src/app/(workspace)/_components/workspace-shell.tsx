"use client";

import { Button, Drawer } from "@heroui/react";
import { useState } from "react";
import type { DocumentTreeItem } from "@/lib/documents/types";
import { MenuIcon } from "./icons";
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

export function WorkspaceShell({
  children,
  documentTree,
  session,
}: WorkspaceShellProps) {
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <main className="min-h-dvh bg-background">
      <div className="flex min-h-dvh flex-col lg:flex-row">
        <aside className="hidden w-full max-w-[304px] shrink-0 border-r border-black/5 bg-surface lg:flex">
          <WorkspaceSidebar documentTree={documentTree} session={session} />
        </aside>
        <section className="flex min-h-dvh min-w-0 flex-1 flex-col bg-background">
          <div className="flex items-center justify-between border-b border-black/5 bg-surface px-4 py-3 lg:hidden">
            <div className="flex flex-col">
              <p className="text-base font-semibold text-foreground">Atlas</p>
              <p className="text-sm text-muted">个人知识空间</p>
            </div>
            <Button
              aria-label="打开导航"
              isIconOnly
              size="sm"
              variant="secondary"
              onPress={() => setMobileSidebarOpen(true)}
            >
              <MenuIcon className="size-4" />
            </Button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </section>
      </div>

      <Drawer.Backdrop
        isOpen={isMobileSidebarOpen}
        onOpenChange={setMobileSidebarOpen}
      >
        <Drawer.Content placement="left">
          <Drawer.Dialog>
            <Drawer.CloseTrigger />
            <Drawer.Header>
              <Drawer.Heading>Atlas</Drawer.Heading>
            </Drawer.Header>
            <Drawer.Body className="p-0">
              <WorkspaceSidebar
                documentTree={documentTree}
                session={session}
                onNavigate={() => setMobileSidebarOpen(false)}
              />
            </Drawer.Body>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </main>
  );
}
