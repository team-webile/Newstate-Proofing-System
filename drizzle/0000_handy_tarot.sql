CREATE TYPE "public"."annotation_status" AS ENUM('PENDING', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('ELEMENT', 'PROJECT');--> statement-breakpoint
CREATE TYPE "public"."comment_status" AS ENUM('ACTIVE', 'RESOLVED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."comment_type" AS ENUM('GENERAL', 'ANNOTATION', 'APPROVAL_REQUEST', 'ADMIN_REPLY');--> statement-breakpoint
CREATE TYPE "public"."element_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('ACTIVE', 'ARCHIVED', 'COMPLETED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."version_status" AS ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "annotation_replies" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"annotation_id" text NOT NULL,
	"project_id" text NOT NULL,
	"added_by" text NOT NULL,
	"added_by_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "annotations" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"file_id" text NOT NULL,
	"project_id" text NOT NULL,
	"added_by" text NOT NULL,
	"added_by_name" text,
	"coordinates" text,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"status" "annotation_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "approval_type" NOT NULL,
	"element_id" text,
	"project_id" text,
	"approved_at" timestamp DEFAULT now() NOT NULL,
	"signature" text NOT NULL,
	"user_name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company" text,
	"address" text,
	"notes" text,
	"logo_url" text,
	"brand_color" text,
	"theme_mode" text DEFAULT 'system' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clients_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "comment_type" DEFAULT 'GENERAL' NOT NULL,
	"status" "comment_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"element_id" text NOT NULL,
	"comment_text" text NOT NULL,
	"coordinates" text,
	"user_name" text NOT NULL,
	"parent_id" text
);
--> statement-breakpoint
CREATE TABLE "element_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL,
	"filename" text NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"element_id" text NOT NULL,
	CONSTRAINT "element_versions_element_id_version_unique" UNIQUE("element_id","version")
);
--> statement-breakpoint
CREATE TABLE "elements" (
	"id" text PRIMARY KEY NOT NULL,
	"status" "element_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"review_id" text NOT NULL,
	"element_name" text NOT NULL,
	"file_path" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"download_enabled" boolean DEFAULT true NOT NULL,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"last_activity" timestamp DEFAULT now() NOT NULL,
	"primary_color" text,
	"secondary_color" text,
	"accent_color" text,
	"custom_css" text,
	"logo_url" text,
	"theme_mode" text DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text,
	"status" "review_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"project_id" text NOT NULL,
	"review_name" text NOT NULL,
	"share_link" text NOT NULL,
	CONSTRAINT "reviews_share_link_unique" UNIQUE("share_link")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"approval_message" text DEFAULT 'Thank you for your approval!' NOT NULL,
	"signature_message" text DEFAULT 'By signing below, I approve this design element.' NOT NULL,
	"company_name" text DEFAULT 'New State Branding' NOT NULL,
	"theme_mode" text DEFAULT 'system' NOT NULL,
	"primary_color" text,
	"secondary_color" text,
	"accent_color" text,
	"border_radius" text DEFAULT '0.625rem' NOT NULL,
	"font_family" text DEFAULT 'Inter' NOT NULL,
	"logo_url" text,
	"favicon_url" text,
	"custom_css" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "versions" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"description" text,
	"status" "version_status" DEFAULT 'DRAFT' NOT NULL,
	"project_id" text NOT NULL,
	"approved_by" text,
	"approved_at" timestamp,
	"rejected_by" text,
	"rejected_at" timestamp,
	"client_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "annotation_replies" ADD CONSTRAINT "annotation_replies_annotation_id_annotations_id_fk" FOREIGN KEY ("annotation_id") REFERENCES "public"."annotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotation_replies" ADD CONSTRAINT "annotation_replies_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "annotations" ADD CONSTRAINT "annotations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_element_id_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_element_id_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "element_versions" ADD CONSTRAINT "element_versions_element_id_elements_id_fk" FOREIGN KEY ("element_id") REFERENCES "public"."elements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "elements" ADD CONSTRAINT "elements_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "versions" ADD CONSTRAINT "versions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;