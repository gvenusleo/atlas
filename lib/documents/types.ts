import type { Value } from "platejs"

export type DocumentContent = Value

export type DocumentTreeDocument = {
  type: "document"
  id: string
  title: string
  folderId: string | null
  sortIndex: number
  createdAt: string
  updatedAt: string
}

export type DocumentTreeFolder = {
  type: "folder"
  id: string
  name: string
  parentFolderId: string | null
  sortIndex: number
  createdAt: string
  updatedAt: string
  children: DocumentTreeNode[]
}

export type DocumentTreeNode = DocumentTreeFolder | DocumentTreeDocument

export type RecentDocument = {
  id: string
  title: string
  folderId: string | null
  updatedAt: string
}

export type SerializedDocument = {
  id: string
  ownerUserId: string
  folderId: string | null
  title: string
  content: DocumentContent
  contentVersion: number
  createdAt: string
  updatedAt: string
}

export type WorkspaceSnapshot = {
  tree: DocumentTreeNode[]
  recentDocuments: RecentDocument[]
}

export type BreadcrumbItem = {
  id: string
  label: string
  href?: string
}
