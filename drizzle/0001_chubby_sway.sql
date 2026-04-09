CREATE TYPE "public"."document_node_kind" AS ENUM('document', 'folder');--> statement-breakpoint
CREATE TYPE "public"."document_revision_source" AS ENUM('initial', 'autosave', 'restore');--> statement-breakpoint
CREATE TABLE "document_nodes" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"parent_id" text,
	"kind" "document_node_kind" NOT NULL,
	"title" text NOT NULL,
	"content_markdown" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_edited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_revisions" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title_snapshot" text NOT NULL,
	"content_markdown_snapshot" text NOT NULL,
	"source" "document_revision_source" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "document_nodes" ADD CONSTRAINT "document_nodes_parent_id_document_nodes_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."document_nodes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_document_id_document_nodes_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."document_nodes"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "document_revisions" ADD CONSTRAINT "document_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "document_nodes_user_id_idx" ON "document_nodes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_nodes_parent_id_idx" ON "document_nodes" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "document_nodes_kind_idx" ON "document_nodes" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "document_nodes_last_edited_at_idx" ON "document_nodes" USING btree ("last_edited_at");--> statement-breakpoint
CREATE INDEX "document_revisions_document_id_idx" ON "document_revisions" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_revisions_user_id_idx" ON "document_revisions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "document_revisions_created_at_idx" ON "document_revisions" USING btree ("created_at");