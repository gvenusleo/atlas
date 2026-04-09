"use client";

import {
  ChevronRightIcon,
  FilePlus2Icon,
  FileTextIcon,
  FolderIcon,
  FolderPlusIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PencilLineIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/app/auth/actions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import type { DocumentTreeItem } from "@/lib/documents/types";
import { cn } from "@/lib/utils";
import {
  createDocumentAction,
  createFolderAction,
  deleteNodeAction,
  renameNodeAction,
} from "../actions";

type WorkspaceSidebarProps = {
  documentTree: DocumentTreeItem[];
  session: {
    user: {
      email: string;
      id: string;
      name: string;
    };
  };
};

type RenameDialogState = {
  id: string;
  title: string;
} | null;

type DeleteDialogState = {
  containsActiveDocument: boolean;
  id: string;
  title: string;
} | null;

type CreateFolderDialogState = {
  parentId: string | null;
} | null;

function collectExpandedFolderIds(items: DocumentTreeItem[]) {
  const folderIds = new Set<string>();

  for (const item of items) {
    if (item.kind === "folder") {
      folderIds.add(item.id);
    }

    for (const child of collectExpandedFolderIds(item.children)) {
      folderIds.add(child);
    }
  }

  return folderIds;
}

function filterDocumentTree(
  items: DocumentTreeItem[],
  query: string,
): DocumentTreeItem[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();

  if (!normalizedQuery) {
    return items;
  }

  return items.flatMap((item) => {
    const nextChildren = filterDocumentTree(item.children, normalizedQuery);
    const matches = item.title.toLocaleLowerCase().includes(normalizedQuery);

    if (!matches && nextChildren.length === 0) {
      return [];
    }

    return [
      {
        ...item,
        children: nextChildren,
      },
    ];
  });
}

function getCurrentDocumentId(pathname: string) {
  const match = pathname.match(/^\/documents\/([^/]+)$/);
  return match?.[1] ?? null;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function nodeContainsDocument(
  node: DocumentTreeItem,
  documentId: string,
): boolean {
  if (node.id === documentId) {
    return true;
  }

  return node.children.some((child) => nodeContainsDocument(child, documentId));
}

function countDocuments(items: DocumentTreeItem[]): number {
  return items.reduce((total, item) => {
    const selfCount = item.kind === "document" ? 1 : 0;
    return total + selfCount + countDocuments(item.children);
  }, 0);
}

export function WorkspaceSidebar({
  documentTree,
  session,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const activeDocumentId = getCurrentDocumentId(pathname);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() =>
    collectExpandedFolderIds(documentTree),
  );
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [renameDialog, setRenameDialog] = useState<RenameDialogState>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);
  const [createFolderDialog, setCreateFolderDialog] =
    useState<CreateFolderDialogState>(null);
  const [createFolderTitle, setCreateFolderTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setExpandedFolderIds(collectExpandedFolderIds(documentTree));
  }, [documentTree]);

  const closeMobileSidebar = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const filteredDocumentTree = filterDocumentTree(documentTree, searchQuery);
  const documentCount = countDocuments(documentTree);

  const handleCreateDocument = async (parentId: string | null) => {
    const key = `create-document:${parentId ?? "root"}`;
    setBusyKey(key);
    const result = await createDocumentAction(parentId);
    setBusyKey(null);

    if (!result.ok) {
      toast.error("创建文档失败", {
        description: result.message,
      });
      return;
    }

    closeMobileSidebar();
    router.push(`/documents/${result.documentId}`);
    router.refresh();
  };

  const handleCreateFolder = async () => {
    if (!createFolderDialog) {
      return;
    }

    const key = `create-folder:${createFolderDialog.parentId ?? "root"}`;
    setBusyKey(key);
    const result = await createFolderAction(
      createFolderDialog.parentId,
      createFolderTitle,
    );
    setBusyKey(null);

    if (!result.ok) {
      toast.error("创建文件夹失败", {
        description: result.message,
      });
      return;
    }

    if (createFolderDialog.parentId) {
      const parentId = createFolderDialog.parentId;

      setExpandedFolderIds((current) => {
        const next = new Set(current);
        next.add(parentId);
        return next;
      });
    }

    setCreateFolderDialog(null);
    setCreateFolderTitle("");
    router.refresh();
  };

  const handleRename = async () => {
    if (!renameDialog) {
      return;
    }

    const key = `rename:${renameDialog.id}`;
    setBusyKey(key);
    const result = await renameNodeAction(renameDialog.id, renameTitle);
    setBusyKey(null);

    if (!result.ok) {
      toast.error("重命名失败", {
        description: result.message,
      });
      return;
    }

    setRenameDialog(null);
    setRenameTitle("");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteDialog) {
      return;
    }

    const key = `delete:${deleteDialog.id}`;
    setBusyKey(key);
    const result = await deleteNodeAction(deleteDialog.id);
    setBusyKey(null);

    if (!result.ok) {
      toast.error("删除失败", {
        description: result.message,
      });
      return;
    }

    const shouldRedirect =
      activeDocumentId && deleteDialog.containsActiveDocument;

    setDeleteDialog(null);

    if (shouldRedirect) {
      closeMobileSidebar();
      router.push("/");
    }

    router.refresh();
  };

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleRename();
  };

  const handleCreateFolderSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    await handleCreateFolder();
  };

  const openCreateFolderDialog = (parentId: string | null) => {
    setCreateFolderDialog({ parentId });
    setCreateFolderTitle("");
  };

  const openRenameDialog = (node: DocumentTreeItem) => {
    setRenameDialog({
      id: node.id,
      title: node.title,
    });
    setRenameTitle(node.title);
  };

  const openDeleteDialog = (node: DocumentTreeItem) => {
    setDeleteDialog({
      containsActiveDocument: activeDocumentId
        ? nodeContainsDocument(node, activeDocumentId)
        : false,
      id: node.id,
      title: node.title,
    });
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolderIds((current) => {
      const next = new Set(current);

      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }

      return next;
    });
  };

  const renderTreeItems = (items: DocumentTreeItem[]) => {
    return items.map((item) => {
      const isExpanded =
        item.kind === "folder"
          ? searchQuery.trim()
            ? true
            : expandedFolderIds.has(item.id)
          : false;
      const isActive = item.kind === "document" && item.id === activeDocumentId;

      return (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            isActive={isActive}
            tooltip={item.title}
            onClick={() => {
              if (item.kind === "folder") {
                toggleFolder(item.id);
                return;
              }

              closeMobileSidebar();
              router.push(`/documents/${item.id}`);
            }}
          >
            {item.kind === "folder" ? (
              item.children.length > 0 ? (
                <ChevronRightIcon
                  className={cn("size-4 transition-transform", {
                    "rotate-90": isExpanded,
                  })}
                />
              ) : (
                <span className="size-4 shrink-0" />
              )
            ) : null}
            {item.kind === "folder" ? <FolderIcon /> : <FileTextIcon />}
            <span>{item.title}</span>
          </SidebarMenuButton>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuAction
                  aria-label={`${item.title} 操作`}
                  showOnHover
                />
              }
            >
              <MoreHorizontalIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {item.kind === "folder" ? (
                <>
                  <DropdownMenuItem
                    onClick={() => void handleCreateDocument(item.id)}
                  >
                    <FilePlus2Icon />
                    <span>新建文档</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => openCreateFolderDialog(item.id)}
                  >
                    <FolderPlusIcon />
                    <span>新建文件夹</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem onClick={() => openRenameDialog(item)}>
                <PencilLineIcon />
                <span>重命名</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => openDeleteDialog(item)}
              >
                <Trash2Icon />
                <span>删除</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {item.kind === "folder" && isExpanded && item.children.length > 0 ? (
            <SidebarMenuSub>{renderTreeItems(item.children)}</SidebarMenuSub>
          ) : null}
        </SidebarMenuItem>
      );
    });
  };

  return (
    <>
      <SidebarHeader className="gap-4 border-b border-sidebar-border p-3">
        <div className="flex items-start gap-3">
          <Avatar size="lg">
            <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              Atlas
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {session.user.name}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">
              {session.user.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="w-full"
            disabled={busyKey === "create-document:root"}
            size="sm"
            onClick={() => void handleCreateDocument(null)}
          >
            <FilePlus2Icon data-icon="inline-start" />
            新建文档
          </Button>
          <Button
            className="w-full"
            disabled={busyKey === "create-folder:root"}
            size="sm"
            variant="outline"
            onClick={() => openCreateFolderDialog(null)}
          >
            <FolderPlusIcon data-icon="inline-start" />
            新建文件夹
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden">
        <SidebarGroup className="gap-3 p-3">
          <SidebarGroupLabel>文档</SidebarGroupLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-sidebar-foreground/50" />
            <SidebarInput
              aria-label="搜索文档"
              className="pl-8"
              placeholder="搜索文档"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <FieldDescription className="px-0 text-sidebar-foreground/60">
            {searchQuery.trim()
              ? "按标题过滤文档树"
              : `${documentCount} 篇文档`}
          </FieldDescription>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup className="min-h-0 flex-1 p-0">
          <SidebarGroupContent className="min-h-0 flex-1">
            <ScrollArea className="h-full px-2 pb-3">
              {filteredDocumentTree.length > 0 ? (
                <SidebarMenu>
                  {renderTreeItems(filteredDocumentTree)}
                </SidebarMenu>
              ) : (
                <Empty className="min-h-[240px] border-sidebar-border px-4">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <FolderIcon />
                    </EmptyMedia>
                    <EmptyTitle>
                      {searchQuery.trim() ? "没有匹配结果" : "还没有文档"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {searchQuery.trim()
                        ? "试试其他关键词"
                        : "创建第一篇 Markdown 文档开始使用"}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter className="gap-2 p-3">
        <form action={logoutAction}>
          <Button className="w-full" type="submit" variant="outline">
            <LogOutIcon data-icon="inline-start" />
            退出登录
          </Button>
        </form>
      </SidebarFooter>

      <Dialog
        open={Boolean(createFolderDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateFolderDialog(null);
            setCreateFolderTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建文件夹</DialogTitle>
            <DialogDescription>
              文件夹只用于组织文档树，不会生成历史版本。
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateFolderSubmit}>
            <Field>
              <FieldLabel htmlFor="create-folder-title">名称</FieldLabel>
              <FieldContent>
                <Input
                  autoFocus
                  id="create-folder-title"
                  maxLength={120}
                  placeholder="未命名文件夹"
                  value={createFolderTitle}
                  onChange={(event) => setCreateFolderTitle(event.target.value)}
                />
                <FieldDescription>
                  默认会自动填充为未命名文件夹
                </FieldDescription>
                <FieldError />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateFolderDialog(null);
                  setCreateFolderTitle("");
                }}
              >
                取消
              </Button>
              <Button
                disabled={
                  busyKey ===
                  `create-folder:${createFolderDialog?.parentId ?? "root"}`
                }
                type="submit"
              >
                创建
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameDialog(null);
            setRenameTitle("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名</DialogTitle>
            <DialogDescription>
              更新当前文档或文件夹的显示名称。
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleRenameSubmit}>
            <Field>
              <FieldLabel htmlFor="rename-node-title">名称</FieldLabel>
              <FieldContent>
                <Input
                  autoFocus
                  id="rename-node-title"
                  maxLength={120}
                  value={renameTitle}
                  onChange={(event) => setRenameTitle(event.target.value)}
                />
                <FieldError />
              </FieldContent>
            </Field>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRenameDialog(null);
                  setRenameTitle("");
                }}
              >
                取消
              </Button>
              <Button
                disabled={busyKey === `rename:${renameDialog?.id ?? ""}`}
                type="submit"
              >
                保存
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null);
          }
        }}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog
                ? `“${deleteDialog.title}”将被永久删除。`
                : "该内容将被永久删除。"}
              {deleteDialog?.containsActiveDocument
                ? " 当前正在编辑的文档也会被移除。"
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={busyKey === `delete:${deleteDialog?.id ?? ""}`}
              variant="destructive"
              onClick={() => void handleDelete()}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
