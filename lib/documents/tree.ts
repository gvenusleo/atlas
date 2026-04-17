import type {
  BreadcrumbItem,
  DocumentTreeDocument,
  DocumentTreeFolder,
  DocumentTreeNode,
  RecentDocument,
} from "@/lib/documents/types"

type FolderSeed = Omit<DocumentTreeFolder, "children" | "type">
type DocumentSeed = Omit<DocumentTreeDocument, "type">

function compareTreeNodes(a: DocumentTreeNode, b: DocumentTreeNode) {
  if (a.sortIndex !== b.sortIndex) {
    return a.sortIndex - b.sortIndex
  }

  if (a.type !== b.type) {
    return a.type === "folder" ? -1 : 1
  }

  const left = a.type === "folder" ? a.name : a.title
  const right = b.type === "folder" ? b.name : b.title

  return left.localeCompare(right, "zh-CN")
}

export function buildDocumentTree(
  folders: FolderSeed[],
  documents: DocumentSeed[]
): DocumentTreeNode[] {
  const folderMap = new Map<string, DocumentTreeFolder>()

  for (const folder of folders) {
    folderMap.set(folder.id, {
      ...folder,
      type: "folder",
      children: [],
    })
  }

  const root: DocumentTreeNode[] = []

  for (const folder of folderMap.values()) {
    if (folder.parentFolderId && folderMap.has(folder.parentFolderId)) {
      folderMap.get(folder.parentFolderId)?.children.push(folder)
      continue
    }

    root.push(folder)
  }

  for (const document of documents) {
    const nextNode: DocumentTreeDocument = {
      ...document,
      type: "document",
    }

    if (document.folderId && folderMap.has(document.folderId)) {
      folderMap.get(document.folderId)?.children.push(nextNode)
      continue
    }

    root.push(nextNode)
  }

  const sortRecursively = (nodes: DocumentTreeNode[]) => {
    nodes.sort(compareTreeNodes)

    for (const node of nodes) {
      if (node.type === "folder") {
        sortRecursively(node.children)
      }
    }
  }

  sortRecursively(root)

  return root
}

export function patchDocumentTitleInTree(
  tree: DocumentTreeNode[],
  documentId: string,
  title: string,
  updatedAt?: string
): DocumentTreeNode[] {
  return tree.map((node): DocumentTreeNode => {
    if (node.type === "folder") {
      return {
        ...node,
        children: patchDocumentTitleInTree(
          node.children,
          documentId,
          title,
          updatedAt
        ),
      }
    }

    if (node.id !== documentId) {
      return node
    }

    return {
      ...node,
      title,
      updatedAt: updatedAt ?? node.updatedAt,
    }
  })
}

export function patchFolderNameInTree(
  tree: DocumentTreeNode[],
  folderId: string,
  name: string
): DocumentTreeNode[] {
  return tree.map((node): DocumentTreeNode => {
    if (node.type === "folder" && node.id === folderId) {
      return { ...node, name }
    }

    if (node.type === "folder") {
      return {
        ...node,
        children: patchFolderNameInTree(node.children, folderId, name),
      }
    }

    return node
  })
}

export function removeNodesFromTree(
  tree: DocumentTreeNode[],
  ids: string[],
  type?: DocumentTreeNode["type"]
): DocumentTreeNode[] {
  const idSet = new Set(ids)

  return tree
    .filter((node) => {
      if (!idSet.has(node.id)) {
        return true
      }

      return type ? node.type !== type : false
    })
    .map((node): DocumentTreeNode => {
      if (node.type !== "folder") {
        return node
      }

      return {
        ...node,
        children: removeNodesFromTree(node.children, ids, type),
      }
    })
}

export function upsertRecentDocument(
  recentDocuments: RecentDocument[],
  nextDocument: RecentDocument
) {
  const nextList = [
    nextDocument,
    ...recentDocuments.filter((document) => document.id !== nextDocument.id),
  ]

  return nextList.slice(0, 6)
}

export function patchRecentDocument(
  recentDocuments: RecentDocument[],
  nextDocument: RecentDocument
) {
  return recentDocuments.map((document) =>
    document.id === nextDocument.id
      ? { ...document, ...nextDocument }
      : document
  )
}

export function removeRecentDocuments(
  recentDocuments: RecentDocument[],
  documentIds: string[]
) {
  const idSet = new Set(documentIds)

  return recentDocuments.filter((document) => !idSet.has(document.id))
}

export function findDocumentBreadcrumbs(
  tree: DocumentTreeNode[],
  documentId: string
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = []

  const visit = (
    nodes: DocumentTreeNode[],
    trail: BreadcrumbItem[]
  ): boolean => {
    for (const node of nodes) {
      if (node.type === "folder") {
        const nextTrail = [
          ...trail,
          {
            id: node.id,
            label: node.name,
          },
        ]

        if (visit(node.children, nextTrail)) {
          return true
        }

        continue
      }

      if (node.id === documentId) {
        path.push(...trail, {
          id: node.id,
          label: node.title,
          href: `/documents/${node.id}`,
        })

        return true
      }
    }

    return false
  }

  visit(tree, [])

  return path
}

export function findDocumentInTree(
  tree: DocumentTreeNode[],
  documentId: string
): DocumentTreeDocument | null {
  for (const node of tree) {
    if (node.type === "document" && node.id === documentId) {
      return node
    }

    if (node.type === "folder") {
      const match = findDocumentInTree(node.children, documentId)

      if (match) {
        return match
      }
    }
  }

  return null
}
