CREATE TABLE `gym_access` (
	`owner_id` text NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text NOT NULL,
	`branches` text NOT NULL,
	`revoked` integer DEFAULT 0 NOT NULL,
	PRIMARY KEY(`owner_id`, `user_id`)
);
--> statement-breakpoint
CREATE TABLE `gym_invites` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`role` text NOT NULL,
	`branches` text NOT NULL,
	`expires_at` text NOT NULL,
	`claimed_by` text
);
