CREATE TYPE "public"."document_asset_kind" AS ENUM('image', 'video', 'audio', 'file', 'embed');--> statement-breakpoint
CREATE TYPE "public"."document_asset_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."storage_provider" AS ENUM('s3');--> statement-breakpoint
CREATE TABLE "document_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"document_id" text NOT NULL,
	"kind" "document_asset_kind" NOT NULL,
	"storage_provider" "storage_provider" NOT NULL,
	"bucket" text NOT NULL,
	"object_key" text NOT NULL,
	"public_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"duration_seconds" integer,
	"status" "document_asset_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_folders" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"parent_folder_id" text,
	"name" text NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_user_id" text NOT NULL,
	"folder_id" text,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '[{"type":"p","children":[{"text":""}]}]'::jsonb NOT NULL,
	"content_version" integer DEFAULT 1 NOT NULL,
	"sort_index" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_assets" ADD CONSTRAINT "document_assets_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_folders" ADD CONSTRAINT "document_folders_parent_fk" FOREIGN KEY ("parent_folder_id") REFERENCES "public"."document_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_owner_user_id_user_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_folder_id_document_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."document_folders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_assets_owner_idx" ON "document_assets" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "document_assets_document_idx" ON "document_assets" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_assets_status_idx" ON "document_assets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "document_folders_owner_idx" ON "document_folders" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "document_folders_parent_idx" ON "document_folders" USING btree ("parent_folder_id");--> statement-breakpoint
CREATE INDEX "document_folders_deleted_idx" ON "document_folders" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "documents_owner_idx" ON "documents" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "documents_folder_idx" ON "documents" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "documents_deleted_idx" ON "documents" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "documents_updated_idx" ON "documents" USING btree ("updated_at");