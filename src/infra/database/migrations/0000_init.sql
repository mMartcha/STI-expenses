CREATE TABLE `audit_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`position` integer NOT NULL,
	`action` text NOT NULL,
	`actor_id` text NOT NULL,
	`at` text NOT NULL,
	`target_id` text,
	`reason` text,
	`changes` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_entity_idx` ON `audit_entries` (`entity_type`,`entity_id`,`position`);--> statement-breakpoint
CREATE TABLE `expense_items` (
	`id` text PRIMARY KEY NOT NULL,
	`expense_id` text NOT NULL,
	`position` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`source` text NOT NULL,
	`removal_reason` text,
	FOREIGN KEY (`expense_id`) REFERENCES `expenses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `expense_items_expense_idx` ON `expense_items` (`expense_id`);--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`report_id` text,
	`description` text NOT NULL,
	`category` text NOT NULL,
	`merchant_name` text,
	`merchant_tax_id` text,
	`occurred_at` text NOT NULL,
	`payment_method` text,
	`notes` text,
	`currency` text NOT NULL,
	`discount` integer NOT NULL,
	`total` integer NOT NULL,
	`receipt_local_uri` text,
	`receipt_mime_type` text,
	`receipt_remote_id` text,
	`ocr_status` text NOT NULL,
	`ocr_error` text,
	`ocr_snapshot` text,
	`locked` integer NOT NULL,
	`sync_status` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `expenses_owner_date_idx` ON `expenses` (`owner_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `expenses_report_idx` ON `expenses` (`report_id`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text NOT NULL,
	`purpose` text,
	`cost_center` text,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`advance` integer,
	`currency` text NOT NULL,
	`status` text NOT NULL,
	`submitted_at` text,
	`decided_at` text,
	`decision_note` text,
	`sync_status` text NOT NULL,
	`version` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_owner_idx` ON `reports` (`owner_id`,`start_date`);--> statement-breakpoint
CREATE TABLE `sync_operations` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`entity_id` text NOT NULL,
	`attempts` integer NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`next_attempt_at` text NOT NULL,
	`last_error` text,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	`dedupe_key` text
);
--> statement-breakpoint
CREATE INDEX `sync_due_idx` ON `sync_operations` (`status`,`next_attempt_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `sync_dedupe_idx` ON `sync_operations` (`dedupe_key`);