import {
  type AnyPgColumn,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    lastSeenAt: timestamp("last_seen_at", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", { mode: "date", withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const documentNodeKindEnum = pgEnum("document_node_kind", [
  "document",
  "folder",
]);

export const documentRevisionSourceEnum = pgEnum("document_revision_source", [
  "initial",
  "autosave",
  "restore",
]);

export const documentNodes = pgTable(
  "document_nodes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    parentId: text("parent_id").references(
      (): AnyPgColumn => documentNodes.id,
      {
        onDelete: "cascade",
        onUpdate: "cascade",
      },
    ),
    kind: documentNodeKindEnum("kind").notNull(),
    title: text("title").notNull(),
    contentMarkdown: text("content_markdown"),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
    lastEditedAt: timestamp("last_edited_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_nodes_user_id_idx").on(table.userId),
    index("document_nodes_parent_id_idx").on(table.parentId),
    index("document_nodes_kind_idx").on(table.kind),
    index("document_nodes_last_edited_at_idx").on(table.lastEditedAt),
  ],
);

export const documentRevisions = pgTable(
  "document_revisions",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id")
      .notNull()
      .references(() => documentNodes.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    titleSnapshot: text("title_snapshot").notNull(),
    contentMarkdownSnapshot: text("content_markdown_snapshot").notNull(),
    source: documentRevisionSourceEnum("source").notNull(),
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_revisions_document_id_idx").on(table.documentId),
    index("document_revisions_user_id_idx").on(table.userId),
    index("document_revisions_created_at_idx").on(table.createdAt),
  ],
);
