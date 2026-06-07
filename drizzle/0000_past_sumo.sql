CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`name` text NOT NULL,
	`icon_identifier` text NOT NULL,
	`color_hex` text NOT NULL,
	`transaction_type_hint` text NOT NULL,
	`is_system` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `failed_parses` (
	`id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`source_channel` text NOT NULL,
	`sender_identifier` text NOT NULL,
	`failure_reason` text NOT NULL,
	`raw_source_text` text,
	`is_reviewed` integer NOT NULL,
	`reviewed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rules` (
	`id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`keyword` text NOT NULL,
	`match_type` text NOT NULL,
	`category_id` text NOT NULL,
	`priority` integer NOT NULL,
	`is_system` integer NOT NULL,
	`last_applied_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`source_channel` text NOT NULL,
	`sender_identifier` text NOT NULL,
	`raw_content_hash` text NOT NULL,
	`parse_status` text NOT NULL,
	`transaction_id` text,
	`failure_reason` text,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`amount` real NOT NULL,
	`currency` text NOT NULL,
	`transaction_type` text NOT NULL,
	`merchant_name` text,
	`category_id` text NOT NULL,
	`account_name` text,
	`account_number_last4` text,
	`transaction_date` integer NOT NULL,
	`available_balance` real,
	`source_channel` text NOT NULL,
	`raw_source_text` text,
	`parse_confidence` text,
	`is_duplicate` integer NOT NULL,
	`is_flagged_for_review` integer NOT NULL,
	`notes` text,
	`is_synced` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
