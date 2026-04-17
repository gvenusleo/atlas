import { relations, sql } from "drizzle-orm"
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

import type { DocumentContent } from "@/lib/documents/types"

import { user } from "./auth"

export const documentAssetKindEnum = pgEnum("document_asset_kind", [
  "image",
  "video",
  "audio",
  "file",
  "embed",
])

export const documentAssetStatusEnum = pgEnum("document_asset_status", [
  "pending",
  "ready",
  "failed",
])

export const storageProviderEnum = pgEnum("storage_provider", ["s3"])

const emptyDocumentContentSql = sql`'[{"type":"p","children":[{"text":""}]}]'::jsonb`

export const documentFolders = pgTable(
  "document_folders",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentFolderId: text("parent_folder_id"),
    name: text("name").notNull(),
    sortIndex: integer("sort_index").notNull().default(0),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.parentFolderId],
      foreignColumns: [table.id],
      name: "document_folders_parent_fk",
    }).onDelete("cascade"),
    index("document_folders_owner_idx").on(table.ownerUserId),
    index("document_folders_parent_idx").on(table.parentFolderId),
    index("document_folders_deleted_idx").on(table.deletedAt),
  ]
)

export const documents = pgTable(
  "documents",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => documentFolders.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    content: jsonb("content")
      .$type<DocumentContent>()
      .notNull()
      .default(emptyDocumentContentSql),
    contentVersion: integer("content_version").notNull().default(1),
    sortIndex: integer("sort_index").notNull().default(0),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("documents_owner_idx").on(table.ownerUserId),
    index("documents_folder_idx").on(table.folderId),
    index("documents_deleted_idx").on(table.deletedAt),
    index("documents_updated_idx").on(table.updatedAt),
  ]
)

export const documentAssets = pgTable(
  "document_assets",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    documentId: text("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    kind: documentAssetKindEnum("kind").notNull(),
    storageProvider: storageProviderEnum("storage_provider").notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull(),
    publicUrl: text("public_url").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: integer("duration_seconds"),
    status: documentAssetStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_assets_owner_idx").on(table.ownerUserId),
    index("document_assets_document_idx").on(table.documentId),
    index("document_assets_status_idx").on(table.status),
  ]
)

export const userDocumentRelations = relations(user, ({ many }) => ({
  documentAssets: many(documentAssets),
  documentFolders: many(documentFolders),
  documents: many(documents),
}))

export const documentFolderRelations = relations(
  documentFolders,
  ({ many, one }) => ({
    children: many(documentFolders, {
      relationName: "folder_children",
    }),
    documents: many(documents),
    owner: one(user, {
      fields: [documentFolders.ownerUserId],
      references: [user.id],
    }),
    parent: one(documentFolders, {
      fields: [documentFolders.parentFolderId],
      references: [documentFolders.id],
      relationName: "folder_children",
    }),
  })
)

export const documentRelations = relations(documents, ({ many, one }) => ({
  assets: many(documentAssets),
  folder: one(documentFolders, {
    fields: [documents.folderId],
    references: [documentFolders.id],
  }),
  owner: one(user, {
    fields: [documents.ownerUserId],
    references: [user.id],
  }),
}))

export const documentAssetRelations = relations(documentAssets, ({ one }) => ({
  document: one(documents, {
    fields: [documentAssets.documentId],
    references: [documents.id],
  }),
  owner: one(user, {
    fields: [documentAssets.ownerUserId],
    references: [user.id],
  }),
}))
