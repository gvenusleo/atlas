"use client"

import * as React from "react"

import {
  createDocument,
  createFolder,
  moveDocument,
  moveDocumentToParent,
  moveFolder,
  moveFolderToParent,
  renameDocument,
  renameFolder,
  softDeleteDocument,
  softDeleteFolder,
} from "@/lib/documents/actions"
import {
  findDocumentInTree,
  patchDocumentTitleInTree,
  patchFolderNameInTree,
  patchRecentDocument,
  removeNodesFromTree,
  removeRecentDocuments,
  upsertRecentDocument,
} from "@/lib/documents/tree"
import type {
  DocumentTreeDocument,
  DocumentTreeNode,
  RecentDocument,
  WorkspaceSnapshot,
} from "@/lib/documents/types"

type WorkspaceUser = {
  email: string
  id: string
  image: string | null
  name: string
}

type DocumentsWorkspaceContextValue = {
  recentDocuments: RecentDocument[]
  tree: DocumentTreeNode[]
  user: WorkspaceUser
  applyDocumentMeta: (input: {
    documentId: string
    title?: string
    updatedAt?: string
  }) => void
  createDocumentInFolder: (folderId?: string | null) => Promise<DocumentTreeDocument>
  createFolderInParent: (
    parentFolderId?: string | null,
    name?: string
  ) => Promise<string>
  deleteDocumentNode: (documentId: string) => Promise<void>
  deleteFolderNode: (folderId: string) => Promise<void>
  moveDocumentNode: (
    documentId: string,
    targetFolderId?: string | null
  ) => Promise<void>
  moveDocumentNodeToParent: (documentId: string) => Promise<void>
  moveFolderNode: (
    folderId: string,
    targetParentFolderId?: string | null
  ) => Promise<void>
  moveFolderNodeToParent: (folderId: string) => Promise<void>
  renameDocumentNode: (documentId: string, title: string) => Promise<void>
  renameFolderNode: (folderId: string, name: string) => Promise<void>
  replaceSnapshot: (snapshot: WorkspaceSnapshot) => void
}

const DocumentsWorkspaceContext =
  React.createContext<DocumentsWorkspaceContextValue | null>(null)

type DocumentsWorkspaceProviderProps = {
  children: React.ReactNode
  initialRecentDocuments: RecentDocument[]
  initialTree: DocumentTreeNode[]
  user: WorkspaceUser
}

export function DocumentsWorkspaceProvider({
  children,
  initialRecentDocuments,
  initialTree,
  user,
}: DocumentsWorkspaceProviderProps) {
  const [tree, setTree] = React.useState(initialTree)
  const [recentDocuments, setRecentDocuments] = React.useState(
    initialRecentDocuments
  )

  const treeRef = React.useRef(tree)
  const recentDocumentsRef = React.useRef(recentDocuments)

  const replaceSnapshot = React.useCallback((snapshot: WorkspaceSnapshot) => {
    treeRef.current = snapshot.tree
    recentDocumentsRef.current = snapshot.recentDocuments
    setTree(snapshot.tree)
    setRecentDocuments(snapshot.recentDocuments)
  }, [])

  React.useEffect(() => {
    replaceSnapshot({
      recentDocuments: initialRecentDocuments,
      tree: initialTree,
    })
  }, [initialRecentDocuments, initialTree, replaceSnapshot])

  const applyDocumentMeta = React.useCallback(
    (input: { documentId: string; title?: string; updatedAt?: string }) => {
      const currentDocument = findDocumentInTree(treeRef.current, input.documentId)

      if (!currentDocument) {
        return
      }

      const nextTitle = input.title ?? currentDocument.title
      const nextUpdatedAt = input.updatedAt ?? currentDocument.updatedAt
      const nextTree = patchDocumentTitleInTree(
        treeRef.current,
        input.documentId,
        nextTitle,
        nextUpdatedAt
      )
      const nextRecentDocuments = upsertRecentDocument(recentDocumentsRef.current, {
        folderId: currentDocument.folderId,
        id: currentDocument.id,
        title: nextTitle,
        updatedAt: nextUpdatedAt,
      })

      treeRef.current = nextTree
      recentDocumentsRef.current = nextRecentDocuments
      setTree(nextTree)
      setRecentDocuments(nextRecentDocuments)
    },
    []
  )

  const createDocumentInFolder = React.useCallback(
    async (folderId: string | null = null) => {
      const result = await createDocument({ folderId })
      replaceSnapshot(result.snapshot)
      return result.document
    },
    [replaceSnapshot]
  )

  const createFolderInParent = React.useCallback(
    async (parentFolderId: string | null = null, name?: string) => {
      const result = await createFolder({ name, parentFolderId })
      replaceSnapshot(result.snapshot)
      return result.folder.id
    },
    [replaceSnapshot]
  )

  const renameDocumentNode = React.useCallback(
    async (documentId: string, title: string) => {
      const result = await renameDocument({ documentId, title })
      const currentDocument = findDocumentInTree(treeRef.current, result.documentId)

      if (!currentDocument) {
        return
      }

      const nextTree = patchDocumentTitleInTree(
        treeRef.current,
        result.documentId,
        result.title,
        result.updatedAt
      )
      const nextRecentDocuments = patchRecentDocument(recentDocumentsRef.current, {
        folderId: currentDocument.folderId,
        id: result.documentId,
        title: result.title,
        updatedAt: result.updatedAt,
      })

      treeRef.current = nextTree
      recentDocumentsRef.current = nextRecentDocuments
      setTree(nextTree)
      setRecentDocuments(nextRecentDocuments)
    },
    []
  )

  const renameFolderNode = React.useCallback(async (folderId: string, name: string) => {
    const result = await renameFolder({ folderId, name })
    const nextTree = patchFolderNameInTree(treeRef.current, result.folderId, result.name)

    treeRef.current = nextTree
    setTree(nextTree)
  }, [])

  const moveDocumentNodeToParent = React.useCallback(
    async (documentId: string) => {
      const result = await moveDocumentToParent({ documentId })
      replaceSnapshot(result.snapshot)
    },
    [replaceSnapshot]
  )

  const moveDocumentNode = React.useCallback(
    async (documentId: string, targetFolderId: string | null = null) => {
      const result = await moveDocument({ documentId, targetFolderId })
      replaceSnapshot(result.snapshot)
    },
    [replaceSnapshot]
  )

  const moveFolderNodeToParent = React.useCallback(
    async (folderId: string) => {
      const result = await moveFolderToParent({ folderId })
      replaceSnapshot(result.snapshot)
    },
    [replaceSnapshot]
  )

  const moveFolderNode = React.useCallback(
    async (folderId: string, targetParentFolderId: string | null = null) => {
      const result = await moveFolder({ folderId, targetParentFolderId })
      replaceSnapshot(result.snapshot)
    },
    [replaceSnapshot]
  )

  const deleteDocumentNode = React.useCallback(async (documentId: string) => {
    const result = await softDeleteDocument({ documentId })
    const nextTree = removeNodesFromTree(treeRef.current, [result.documentId], "document")
    const nextRecentDocuments = removeRecentDocuments(recentDocumentsRef.current, [
      result.documentId,
    ])

    treeRef.current = nextTree
    recentDocumentsRef.current = nextRecentDocuments
    setTree(nextTree)
    setRecentDocuments(nextRecentDocuments)
  }, [])

  const deleteFolderNode = React.useCallback(async (folderId: string) => {
    const result = await softDeleteFolder({ folderId })
    const nextTree = removeNodesFromTree(treeRef.current, result.deletedFolderIds)
    const nextRecentDocuments = removeRecentDocuments(
      recentDocumentsRef.current,
      result.deletedDocumentIds
    )

    treeRef.current = nextTree
    recentDocumentsRef.current = nextRecentDocuments
    setTree(nextTree)
    setRecentDocuments(nextRecentDocuments)
  }, [])

  const value = React.useMemo<DocumentsWorkspaceContextValue>(
    () => ({
      applyDocumentMeta,
      createDocumentInFolder,
      createFolderInParent,
      deleteDocumentNode,
      deleteFolderNode,
      moveDocumentNode,
      moveDocumentNodeToParent,
      moveFolderNode,
      moveFolderNodeToParent,
      recentDocuments,
      renameDocumentNode,
      renameFolderNode,
      replaceSnapshot,
      tree,
      user,
    }),
    [
      applyDocumentMeta,
      createDocumentInFolder,
      createFolderInParent,
      deleteDocumentNode,
      deleteFolderNode,
      moveDocumentNode,
      moveDocumentNodeToParent,
      moveFolderNode,
      moveFolderNodeToParent,
      recentDocuments,
      renameDocumentNode,
      renameFolderNode,
      replaceSnapshot,
      tree,
      user,
    ]
  )

  return (
    <DocumentsWorkspaceContext.Provider value={value}>
      {children}
    </DocumentsWorkspaceContext.Provider>
  )
}

export function useDocumentsWorkspace() {
  const context = React.useContext(DocumentsWorkspaceContext)

  if (!context) {
    throw new Error("useDocumentsWorkspace must be used within a provider.")
  }

  return context
}
