"use client"

import * as React from "react"

import { useRouter } from "next/navigation"
import {
  ArrowUpToLineIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  MoveLeftIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { DeleteNodeDialog } from "@/components/document-tree/delete-node-dialog"
import { NodeNameDialog } from "@/components/document-tree/node-name-dialog"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar"
import { isFolderDescendant } from "@/lib/documents/tree"
import type {
  DocumentTreeDocument,
  DocumentTreeFolder,
  DocumentTreeNode,
} from "@/lib/documents/types"
import { cn } from "@/lib/utils"

const DRAG_THRESHOLD_PX = 6
const CLICK_SUPPRESS_MS = 250

type DocumentTreeProps = {
  currentDocumentId?: string | null
}

type TreeNodeProps = {
  currentDocumentId?: string | null
  depth: number
  node: DocumentTreeNode
  dragItem: DragItem | null
  dropTarget: DropTarget | null
  onNodePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DragItem
  ) => void
  onNodeClickCapture: (event: React.MouseEvent<HTMLElement>) => void
}

type DragItem =
  | Pick<DocumentTreeDocument, "folderId" | "id" | "title" | "type">
  | Pick<DocumentTreeFolder, "id" | "name" | "parentFolderId" | "type">

type DropTarget = { type: "folder"; folderId: string } | { type: "root" }

type PendingDrag = {
  item: DragItem
  startX: number
  startY: number
}

function hasActiveDocument(
  node: DocumentTreeNode,
  currentDocumentId?: string | null
): boolean {
  if (!currentDocumentId) {
    return false
  }

  if (node.type === "document") {
    return node.id === currentDocumentId
  }

  return node.children.some((child) =>
    hasActiveDocument(child, currentDocumentId)
  )
}

function isSameDropTarget(
  left: DropTarget | null,
  right: DropTarget | null
): boolean {
  if (left?.type !== right?.type) {
    return false
  }

  if (!left || !right) {
    return left === right
  }

  if (left.type === "root" && right.type === "root") {
    return true
  }

  return (
    left.type === "folder" &&
    right.type === "folder" &&
    left.folderId === right.folderId
  )
}

function isDraggedNode(
  dragItem: DragItem | null,
  node: DocumentTreeNode
): boolean {
  return dragItem?.type === node.type && dragItem.id === node.id
}

function canDropItemOnTarget(
  tree: DocumentTreeNode[],
  dragItem: DragItem,
  target: DropTarget
): boolean {
  if (target.type === "root") {
    return dragItem.type === "document"
      ? dragItem.folderId !== null
      : dragItem.parentFolderId !== null
  }

  if (dragItem.type === "document") {
    return dragItem.folderId !== target.folderId
  }

  if (dragItem.id === target.folderId) {
    return false
  }

  if (dragItem.parentFolderId === target.folderId) {
    return false
  }

  return !isFolderDescendant(tree, dragItem.id, target.folderId)
}

export function DocumentTree({
  currentDocumentId,
}: DocumentTreeProps): React.JSX.Element {
  const { moveDocumentNode, moveFolderNode, tree } = useDocumentsWorkspace()
  const [dragItem, setDragItem] = React.useState<DragItem | null>(null)
  const [dropTarget, setDropTarget] = React.useState<DropTarget | null>(null)

  const treeRef = React.useRef(tree)
  const dragItemRef = React.useRef<DragItem | null>(null)
  const dropTargetRef = React.useRef<DropTarget | null>(null)
  const pendingDragRef = React.useRef<PendingDrag | null>(null)
  const pointerListenersCleanupRef = React.useRef<(() => void) | null>(null)
  const suppressClickUntilRef = React.useRef(0)
  const bodyStyleRef = React.useRef<{
    cursor: string
    userSelect: string
  } | null>(null)

  React.useEffect(() => {
    treeRef.current = tree
  }, [tree])

  const restoreBodyDragState = React.useCallback(() => {
    if (!bodyStyleRef.current) {
      return
    }

    document.body.style.cursor = bodyStyleRef.current.cursor
    document.body.style.userSelect = bodyStyleRef.current.userSelect
    bodyStyleRef.current = null
  }, [])

  const applyBodyDragState = React.useCallback(() => {
    if (bodyStyleRef.current) {
      return
    }

    bodyStyleRef.current = {
      cursor: document.body.style.cursor,
      userSelect: document.body.style.userSelect,
    }

    document.body.style.cursor = "grabbing"
    document.body.style.userSelect = "none"
  }, [])

  const cleanupPointerListeners = React.useCallback(() => {
    pointerListenersCleanupRef.current?.()
    pointerListenersCleanupRef.current = null
  }, [])

  const resetDraggingState = React.useCallback(
    (options?: { suppressClick?: boolean }) => {
      cleanupPointerListeners()
      pendingDragRef.current = null
      dragItemRef.current = null
      dropTargetRef.current = null
      setDragItem(null)
      setDropTarget(null)
      restoreBodyDragState()

      if (options?.suppressClick) {
        suppressClickUntilRef.current = Date.now() + CLICK_SUPPRESS_MS
      }
    },
    [cleanupPointerListeners, restoreBodyDragState]
  )

  React.useEffect(() => {
    return () => {
      cleanupPointerListeners()
      restoreBodyDragState()
    }
  }, [cleanupPointerListeners, restoreBodyDragState])

  const applyDrop = React.useCallback(
    async (nextDragItem: DragItem, nextDropTarget: DropTarget) => {
      try {
        if (nextDragItem.type === "document") {
          await moveDocumentNode(
            nextDragItem.id,
            nextDropTarget.type === "root" ? null : nextDropTarget.folderId
          )
          return
        }

        await moveFolderNode(
          nextDragItem.id,
          nextDropTarget.type === "root" ? null : nextDropTarget.folderId
        )
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "拖拽移动失败，请稍后重试。"
        )
      }
    },
    [moveDocumentNode, moveFolderNode]
  )

  const resolveDropTarget = React.useCallback(
    (
      clientX: number,
      clientY: number,
      nextDragItem: DragItem
    ): DropTarget | null => {
      const element = document.elementFromPoint(clientX, clientY)

      if (!(element instanceof HTMLElement)) {
        return null
      }

      const targetElement = element.closest<HTMLElement>(
        "[data-document-tree-drop-target]"
      )

      if (!targetElement) {
        return null
      }

      const rawTarget = targetElement.dataset.documentTreeDropTarget
      const candidate =
        rawTarget === "root"
          ? { type: "root" as const }
          : rawTarget === "folder" && targetElement.dataset.folderId
            ? {
                type: "folder" as const,
                folderId: targetElement.dataset.folderId,
              }
            : null

      if (!candidate) {
        return null
      }

      return canDropItemOnTarget(treeRef.current, nextDragItem, candidate)
        ? candidate
        : null
    },
    []
  )

  const onNodePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, item: DragItem) => {
      if (
        event.button !== 0 ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.pointerType === "touch"
      ) {
        return
      }

      cleanupPointerListeners()
      pendingDragRef.current = {
        item,
        startX: event.clientX,
        startY: event.clientY,
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const pendingDrag = pendingDragRef.current

        if (!pendingDrag) {
          return
        }

        if (!dragItemRef.current) {
          const deltaX = moveEvent.clientX - pendingDrag.startX
          const deltaY = moveEvent.clientY - pendingDrag.startY

          if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
            return
          }

          dragItemRef.current = pendingDrag.item
          setDragItem(pendingDrag.item)
          applyBodyDragState()
        }

        const nextDragItem = dragItemRef.current

        if (!nextDragItem) {
          return
        }

        const nextDropTarget = resolveDropTarget(
          moveEvent.clientX,
          moveEvent.clientY,
          nextDragItem
        )

        if (isSameDropTarget(dropTargetRef.current, nextDropTarget)) {
          return
        }

        dropTargetRef.current = nextDropTarget
        setDropTarget(nextDropTarget)
      }

      const handlePointerUp = () => {
        const nextDragItem = dragItemRef.current
        const nextDropTarget = dropTargetRef.current

        resetDraggingState({
          suppressClick: Boolean(nextDragItem),
        })

        if (!nextDragItem || !nextDropTarget) {
          return
        }

        void applyDrop(nextDragItem, nextDropTarget)
      }

      const handlePointerCancel = () => {
        resetDraggingState({
          suppressClick: Boolean(dragItemRef.current),
        })
      }

      window.addEventListener("pointermove", handlePointerMove)
      window.addEventListener("pointerup", handlePointerUp)
      window.addEventListener("pointercancel", handlePointerCancel)

      pointerListenersCleanupRef.current = () => {
        window.removeEventListener("pointermove", handlePointerMove)
        window.removeEventListener("pointerup", handlePointerUp)
        window.removeEventListener("pointercancel", handlePointerCancel)
      }
    },
    [
      applyBodyDragState,
      applyDrop,
      cleanupPointerListeners,
      resetDraggingState,
      resolveDropTarget,
    ]
  )

  const onNodeClickCapture = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (Date.now() >= suppressClickUntilRef.current) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
    },
    []
  )

  if (tree.length === 0) {
    return (
      <div className="px-2 py-3 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        还没有文档，先新建一篇开始。
      </div>
    )
  }

  const isRootDropTarget = dropTarget?.type === "root"

  return (
    <SidebarMenu>
      {dragItem ? (
        <SidebarMenuItem>
          <SidebarMenuButton
            className="cursor-grabbing"
            data-document-tree-drop-target="root"
            isActive={isRootDropTarget}
            tabIndex={-1}
            tooltip="移到根目录"
            variant="outline"
          >
            <ArrowUpToLineIcon />
            <span>移到根目录</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ) : null}

      {tree.map((node) => (
        <TreeNode
          key={node.id}
          currentDocumentId={currentDocumentId}
          depth={0}
          dragItem={dragItem}
          dropTarget={dropTarget}
          node={node}
          onNodeClickCapture={onNodeClickCapture}
          onNodePointerDown={onNodePointerDown}
        />
      ))}
    </SidebarMenu>
  )
}

function TreeNode({
  currentDocumentId,
  depth,
  dragItem,
  dropTarget,
  node,
  onNodePointerDown,
  onNodeClickCapture,
}: TreeNodeProps): React.JSX.Element {
  if (node.type === "document") {
    return (
      <DocumentLeaf
        currentDocumentId={currentDocumentId}
        dragItem={dragItem}
        node={node}
        onNodeClickCapture={onNodeClickCapture}
        onNodePointerDown={onNodePointerDown}
      />
    )
  }

  return (
    <FolderBranch
      currentDocumentId={currentDocumentId}
      depth={depth}
      dragItem={dragItem}
      dropTarget={dropTarget}
      node={node}
      onNodeClickCapture={onNodeClickCapture}
      onNodePointerDown={onNodePointerDown}
    />
  )
}

function DocumentLeaf({
  currentDocumentId,
  dragItem,
  node,
  onNodeClickCapture,
  onNodePointerDown,
}: {
  currentDocumentId?: string | null
  dragItem: DragItem | null
  node: Extract<DocumentTreeNode, { type: "document" }>
  onNodeClickCapture: (event: React.MouseEvent<HTMLElement>) => void
  onNodePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DragItem
  ) => void
}): React.JSX.Element {
  const router = useRouter()
  const {
    createDocumentInFolder,
    deleteDocumentNode,
    moveDocumentNodeToParent,
    renameDocumentNode,
  } = useDocumentsWorkspace()
  const isActive = currentDocumentId === node.id
  const isDragging = isDraggedNode(dragItem, node)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          className={cn(
            "cursor-grab active:cursor-grabbing",
            isDragging && "opacity-40"
          )}
          isActive={isActive}
          tooltip={node.title}
          onClick={() => {
            router.push(`/documents/${node.id}`)
          }}
          onClickCapture={onNodeClickCapture}
          onPointerDown={(event) => {
            onNodePointerDown(event, node)
          }}
        >
          <FileTextIcon />
          <span>{node.title}</span>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <MoreHorizontalIcon />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  setRenameOpen(true)
                }}
              >
                <PencilLineIcon />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!node.folderId}
                onSelect={() => {
                  void moveDocumentNodeToParent(node.id)
                }}
              >
                <MoveLeftIcon />
                移到上一级
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void createDocumentInFolder(node.folderId).then(
                    (document) => {
                      router.push(`/documents/${document.id}`)
                    }
                  )
                }}
              >
                <PlusIcon />
                同级新建文档
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setDeleteOpen(true)
                }}
              >
                <Trash2Icon />
                删除
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      <NodeNameDialog
        confirmLabel="保存"
        defaultValue={node.title}
        description="文档标题会同时更新到侧边栏和最近文档列表。"
        open={renameOpen}
        placeholder="输入文档标题"
        title="重命名文档"
        onOpenChange={setRenameOpen}
        onSubmit={(value) => renameDocumentNode(node.id, value)}
      />

      <DeleteNodeDialog
        description="文档会从侧边栏和最近文档中移除，稍后可在回收站能力里恢复。"
        open={deleteOpen}
        title="移除这篇文档？"
        onDelete={() => deleteDocumentNode(node.id)}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}

function FolderBranch({
  currentDocumentId,
  depth,
  dragItem,
  dropTarget,
  node,
  onNodeClickCapture,
  onNodePointerDown,
}: {
  currentDocumentId?: string | null
  depth: number
  dragItem: DragItem | null
  dropTarget: DropTarget | null
  node: Extract<DocumentTreeNode, { type: "folder" }>
  onNodeClickCapture: (event: React.MouseEvent<HTMLElement>) => void
  onNodePointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    item: DragItem
  ) => void
}): React.JSX.Element {
  const router = useRouter()
  const {
    createDocumentInFolder,
    createFolderInParent,
    deleteFolderNode,
    moveFolderNodeToParent,
    renameFolderNode,
  } = useDocumentsWorkspace()
  const defaultOpen = hasActiveDocument(node, currentDocumentId) || depth === 0
  const [isOpen, setIsOpen] = React.useState(defaultOpen)
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [createFolderOpen, setCreateFolderOpen] = React.useState(false)
  const isDragging = isDraggedNode(dragItem, node)
  const isDropTarget =
    dropTarget?.type === "folder" && dropTarget.folderId === node.id

  React.useEffect(() => {
    if (hasActiveDocument(node, currentDocumentId)) {
      setIsOpen(true)
    }
  }, [currentDocumentId, node])

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          className={cn(
            "cursor-grab active:cursor-grabbing",
            isDragging && "opacity-40"
          )}
          data-document-tree-drop-target="folder"
          data-folder-id={node.id}
          isActive={isDropTarget}
          tooltip={node.name}
          onClick={() => {
            setIsOpen((value) => !value)
          }}
          onClickCapture={onNodeClickCapture}
          onPointerDown={(event) => {
            onNodePointerDown(event, node)
          }}
        >
          {isOpen ? <FolderOpenIcon /> : <FolderIcon />}
          <span>{node.name}</span>
        </SidebarMenuButton>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover>
              <MoreHorizontalIcon />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onSelect={() => {
                  void createDocumentInFolder(node.id).then((document) => {
                    router.push(`/documents/${document.id}`)
                  })
                }}
              >
                <PlusIcon />
                新建文档
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setCreateFolderOpen(true)
                }}
              >
                <FolderIcon />
                新建文件夹
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  setRenameOpen(true)
                }}
              >
                <PencilLineIcon />
                重命名
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!node.parentFolderId}
                onSelect={() => {
                  void moveFolderNodeToParent(node.id)
                }}
              >
                <MoveLeftIcon />
                移到上一级
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => {
                  setDeleteOpen(true)
                }}
              >
                <Trash2Icon />
                删除
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {isOpen ? (
          <SidebarMenuSub>
            {node.children.map((child) => (
              <TreeNode
                key={child.id}
                currentDocumentId={currentDocumentId}
                depth={depth + 1}
                dragItem={dragItem}
                dropTarget={dropTarget}
                node={child}
                onNodeClickCapture={onNodeClickCapture}
                onNodePointerDown={onNodePointerDown}
              />
            ))}
          </SidebarMenuSub>
        ) : null}
      </SidebarMenuItem>

      <NodeNameDialog
        confirmLabel="保存"
        defaultValue={node.name}
        description="文件夹只管理层级结构，不影响文档正文内容。"
        open={renameOpen}
        placeholder="输入文件夹名称"
        title="重命名文件夹"
        onOpenChange={setRenameOpen}
        onSubmit={(value) => renameFolderNode(node.id, value)}
      />

      <NodeNameDialog
        confirmLabel="创建"
        description="新文件夹会创建在当前文件夹之下。"
        open={createFolderOpen}
        placeholder="输入文件夹名称"
        title="新建文件夹"
        onOpenChange={setCreateFolderOpen}
        onSubmit={(value) =>
          createFolderInParent(node.id, value).then(() => undefined)
        }
      />

      <DeleteNodeDialog
        description="会同时移除这个文件夹下的所有子文件夹和文档。"
        open={deleteOpen}
        title="移除这个文件夹？"
        onDelete={() => deleteFolderNode(node.id)}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
