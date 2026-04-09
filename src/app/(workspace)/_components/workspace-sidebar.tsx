"use client";

import {
  Alert,
  Avatar,
  Button,
  Dropdown,
  Form,
  Input,
  Label,
  Modal,
  ScrollShadow,
  TextField,
} from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/auth/actions";
import type { DocumentTreeItem } from "@/lib/documents/types";
import {
  createDocumentAction,
  createFolderAction,
  deleteNodeAction,
  renameNodeAction,
} from "../actions";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SignOutIcon,
} from "./icons";

type WorkspaceSidebarProps = {
  documentTree: DocumentTreeItem[];
  onNavigate?: () => void;
  session: {
    user: {
      email: string;
      id: string;
      name: string;
    };
  };
};

type FeedbackState = {
  message: string;
  status: "danger";
} | null;

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
  onNavigate,
  session,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeDocumentId = getCurrentDocumentId(pathname);
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(() =>
    collectExpandedFolderIds(documentTree),
  );
  const [feedback, setFeedback] = useState<FeedbackState>(null);
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

  const clearFeedback = () => {
    if (feedback) {
      setFeedback(null);
    }
  };

  const filteredDocumentTree = filterDocumentTree(documentTree, searchQuery);
  const documentCount = countDocuments(documentTree);

  const handleCreateDocument = async (parentId: string | null) => {
    setBusyKey(`create-document:${parentId ?? "root"}`);
    clearFeedback();

    const result = await createDocumentAction(parentId);
    setBusyKey(null);

    if (!result.ok) {
      setFeedback({
        message: result.message,
        status: "danger",
      });
      return;
    }

    onNavigate?.();
    router.push(`/documents/${result.documentId}`);
    router.refresh();
  };

  const handleCreateFolder = async () => {
    if (!createFolderDialog) {
      return;
    }

    setBusyKey(`create-folder:${createFolderDialog.parentId ?? "root"}`);
    clearFeedback();

    const result = await createFolderAction(
      createFolderDialog.parentId,
      createFolderTitle,
    );
    setBusyKey(null);

    if (!result.ok) {
      setFeedback({
        message: result.message,
        status: "danger",
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

    setBusyKey(`rename:${renameDialog.id}`);
    clearFeedback();

    const result = await renameNodeAction(renameDialog.id, renameTitle);
    setBusyKey(null);

    if (!result.ok) {
      setFeedback({
        message: result.message,
        status: "danger",
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

    setBusyKey(`delete:${deleteDialog.id}`);
    clearFeedback();

    const result = await deleteNodeAction(deleteDialog.id);
    setBusyKey(null);

    if (!result.ok) {
      setFeedback({
        message: result.message,
        status: "danger",
      });
      return;
    }

    const shouldRedirect =
      activeDocumentId && deleteDialog.containsActiveDocument;

    setDeleteDialog(null);

    if (shouldRedirect) {
      onNavigate?.();
      router.push("/");
    }

    router.refresh();
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

  const renderTreeItems = (items: DocumentTreeItem[], depth = 0) => {
    return items.map((item) => {
      const isExpanded =
        item.kind === "folder"
          ? searchQuery.trim()
            ? true
            : expandedFolderIds.has(item.id)
          : false;
      const isActive = item.kind === "document" && item.id === activeDocumentId;
      const rowPadding = {
        paddingLeft: `${depth * 12}px`,
      };

      return (
        <div key={item.id} className="group space-y-1" style={rowPadding}>
          <div className="flex items-center gap-1">
            <Button
              className="min-w-0 justify-start"
              fullWidth
              size="sm"
              variant={isActive ? "secondary" : "ghost"}
              onPress={() => {
                if (item.kind === "folder") {
                  toggleFolder(item.id);
                  return;
                }

                onNavigate?.();
                router.push(`/documents/${item.id}`);
              }}
            >
              {item.kind === "folder" ? (
                item.children.length > 0 ? (
                  isExpanded ? (
                    <ChevronDownIcon className="size-4 shrink-0" />
                  ) : (
                    <ChevronRightIcon className="size-4 shrink-0" />
                  )
                ) : (
                  <span className="size-4 shrink-0" />
                )
              ) : null}
              {item.kind === "folder" ? (
                <FolderIcon className="size-4 shrink-0" />
              ) : (
                <FileIcon className="size-4 shrink-0" />
              )}
              <span className="truncate">{item.title}</span>
            </Button>

            <Dropdown>
              <Dropdown.Trigger>
                <Button
                  aria-label={`${item.title} 操作`}
                  className={
                    isActive ? "" : "opacity-0 group-hover:opacity-100"
                  }
                  isIconOnly
                  size="sm"
                  variant="tertiary"
                >
                  <MoreHorizontalIcon className="size-4" />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Popover>
                <Dropdown.Menu
                  onAction={(key) => {
                    if (key === "create-document") {
                      void handleCreateDocument(
                        item.kind === "folder" ? item.id : item.parentId,
                      );
                      return;
                    }

                    if (key === "create-folder") {
                      openCreateFolderDialog(
                        item.kind === "folder" ? item.id : item.parentId,
                      );
                      return;
                    }

                    if (key === "rename") {
                      openRenameDialog(item);
                      return;
                    }

                    if (key === "delete") {
                      openDeleteDialog(item);
                    }
                  }}
                >
                  {item.kind === "folder" ? (
                    <>
                      <Dropdown.Item id="create-document" textValue="新建文档">
                        <Label>新建文档</Label>
                      </Dropdown.Item>
                      <Dropdown.Item id="create-folder" textValue="新建文件夹">
                        <Label>新建文件夹</Label>
                      </Dropdown.Item>
                    </>
                  ) : null}
                  <Dropdown.Item id="rename" textValue="重命名">
                    <Label>重命名</Label>
                  </Dropdown.Item>
                  <Dropdown.Item id="delete" textValue="删除" variant="danger">
                    <Label>删除</Label>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown.Popover>
            </Dropdown>
          </div>

          {item.kind === "folder" && isExpanded && item.children.length > 0
            ? renderTreeItems(item.children, depth + 1)
            : null}
        </div>
      );
    });
  };

  return (
    <>
      <div className="flex min-h-full w-full flex-col bg-surface">
        <div className="border-b border-black/5 px-4 py-5">
          <div className="flex items-center gap-3">
            <Avatar color="accent" size="md" variant="soft">
              <Avatar.Fallback>
                {getInitials(session.user.name)}
              </Avatar.Fallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-foreground">
                Atlas
              </p>
              <p className="truncate text-sm text-muted">{session.user.name}</p>
              <p className="truncate text-sm text-muted">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Input
              aria-label="搜索文档"
              fullWidth
              placeholder="搜索文档"
              value={searchQuery}
              variant="secondary"
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button
              fullWidth
              isPending={busyKey === "create-document:root"}
              size="sm"
              onPress={() => void handleCreateDocument(null)}
            >
              <PlusIcon className="size-4" />
              新建文档
            </Button>
            <Button
              fullWidth
              isPending={busyKey === "create-folder:root"}
              size="sm"
              variant="secondary"
              onPress={() => openCreateFolderDialog(null)}
            >
              <FolderIcon className="size-4" />
              新建文件夹
            </Button>
          </div>
          {feedback ? (
            <Alert className="mt-3" status={feedback.status}>
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>操作失败</Alert.Title>
                <Alert.Description>{feedback.message}</Alert.Description>
              </Alert.Content>
            </Alert>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-4 pb-3 pt-4">
            <p className="text-sm font-semibold text-foreground">
              {searchQuery.trim() ? "搜索结果" : "我的文档"}
            </p>
            <p className="text-xs text-muted">{documentCount} 篇</p>
          </div>
          <ScrollShadow className="flex-1 px-4 pb-4" hideScrollBar size={36}>
            <div className="space-y-1">
              {filteredDocumentTree.length > 0 ? (
                renderTreeItems(filteredDocumentTree)
              ) : (
                <p className="px-2 py-2 text-sm text-muted">
                  {documentTree.length === 0
                    ? "还没有任何文档，先创建第一篇内容。"
                    : "没有匹配的文档。"}
                </p>
              )}
            </div>
          </ScrollShadow>
        </div>

        <div className="border-t border-black/5 p-4">
          <form action={logoutAction}>
            <Button fullWidth size="sm" type="submit" variant="ghost">
              <SignOutIcon className="size-4" />
              退出登录
            </Button>
          </form>
        </div>
      </div>

      <Modal.Backdrop
        isOpen={Boolean(createFolderDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateFolderDialog(null);
            setCreateFolderTitle("");
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>新建文件夹</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Form
                aria-label="新建文件夹"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleCreateFolder();
                }}
              >
                <TextField className="w-full" name="title">
                  <Label>文件夹名称</Label>
                  <Input
                    value={createFolderTitle}
                    onChange={(event) =>
                      setCreateFolderTitle(event.target.value)
                    }
                  />
                </TextField>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                variant="secondary"
                onPress={() => {
                  setCreateFolderDialog(null);
                  setCreateFolderTitle("");
                }}
              >
                取消
              </Button>
              <Button
                isPending={busyKey?.startsWith("create-folder:")}
                onPress={() => void handleCreateFolder()}
              >
                创建
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={Boolean(renameDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setRenameDialog(null);
            setRenameTitle("");
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>重命名</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <Form
                aria-label="重命名"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleRename();
                }}
              >
                <TextField className="w-full" name="title">
                  <Label>名称</Label>
                  <Input
                    value={renameTitle}
                    onChange={(event) => setRenameTitle(event.target.value)}
                  />
                </TextField>
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Button
                slot="close"
                variant="secondary"
                onPress={() => {
                  setRenameDialog(null);
                  setRenameTitle("");
                }}
              >
                取消
              </Button>
              <Button
                isPending={
                  Boolean(renameDialog) && busyKey?.startsWith("rename:")
                }
                onPress={() => void handleRename()}
              >
                保存
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>

      <Modal.Backdrop
        isOpen={Boolean(deleteDialog)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteDialog(null);
          }
        }}
      >
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-md">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>删除内容</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="text-sm leading-6 text-muted">
                将永久删除“{deleteDialog?.title ?? ""}
                ”及其关联内容，这个操作不能撤销。
              </p>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                取消
              </Button>
              <Button
                isPending={
                  Boolean(deleteDialog) && busyKey?.startsWith("delete:")
                }
                variant="danger"
                onPress={() => void handleDelete()}
              >
                删除
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
