"use client"

import * as React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FileTextIcon,
  FolderIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  MoveLeftIcon,
  PencilLineIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react"

import { DeleteNodeDialog } from "@/components/document-tree/delete-node-dialog"
import { NodeNameDialog } from "@/components/document-tree/node-name-dialog"
import { useDocumentsWorkspace } from "@/components/documents/documents-workspace-provider"
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { DocumentTreeNode } from "@/lib/documents/types"

type DocumentTreeProps = {
  currentDocumentId?: string | null
}

type TreeNodeProps = {
  currentDocumentId?: string | null
  depth: number
  node: DocumentTreeNode
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

export function DocumentTree({
  currentDocumentId,
}: DocumentTreeProps): React.JSX.Element {
  const { tree } = useDocumentsWorkspace()

  if (tree.length === 0) {
    return (
      <div className="px-2 py-3 text-sm text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
        还没有文档，先新建一篇开始。
      </div>
    )
  }

  return (
    <SidebarMenu>
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          currentDocumentId={currentDocumentId}
          depth={0}
          node={node}
        />
      ))}
    </SidebarMenu>
  )
}

function TreeNode({
  currentDocumentId,
  depth,
  node,
}: TreeNodeProps): React.JSX.Element {
  if (node.type === "document") {
    return <DocumentLeaf currentDocumentId={currentDocumentId} node={node} />
  }

  return (
    <FolderBranch
      currentDocumentId={currentDocumentId}
      depth={depth}
      node={node}
    />
  )
}

function DocumentLeaf({
  currentDocumentId,
  node,
}: {
  currentDocumentId?: string | null
  node: Extract<DocumentTreeNode, { type: "document" }>
}): React.JSX.Element {
  const router = useRouter()
  const {
    createDocumentInFolder,
    deleteDocumentNode,
    moveDocumentNodeToParent,
    renameDocumentNode,
  } = useDocumentsWorkspace()

  const isActive = currentDocumentId === node.id
  const [renameOpen, setRenameOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isActive} tooltip={node.title}>
          <Link href={`/documents/${node.id}`}>
            <FileTextIcon />
            <span>{node.title}</span>
          </Link>
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
  node,
}: {
  currentDocumentId?: string | null
  depth: number
  node: Extract<DocumentTreeNode, { type: "folder" }>
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

  React.useEffect(() => {
    if (hasActiveDocument(node, currentDocumentId)) {
      setIsOpen(true)
    }
  }, [currentDocumentId, node])

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={node.name}
          onClick={() => {
            setIsOpen((value: boolean) => !value)
          }}
        >
          {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
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
                node={child}
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
