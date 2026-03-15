CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"edge_cmpy_id" varchar(20),
	"name" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"description" text,
	"sector" varchar(100),
	"subsector" varchar(100),
	"website_url" varchar(255),
	"address" text,
	"email" varchar(255),
	"phone" varchar(50),
	"incorporation_date" date,
	"fiscal_year_end" varchar(10),
	"external_auditor" varchar(255),
	"transfer_agent" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "companies_edge_cmpy_id_unique" UNIQUE("edge_cmpy_id")
);
--> statement-breakpoint
ALTER TABLE "dividends" ADD COLUMN "security_type" varchar(20);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "company_id" integer;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "edge_cmpy_id" varchar(20);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "edge_sec_id" varchar(20);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "board_lot" integer;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "par_value" numeric(10, 4);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "isin" varchar(20);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "issue_type" varchar(50);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "free_float_level" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "foreign_ownership_limit" numeric(6, 4);--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "outstanding_shares" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "listed_shares" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD COLUMN "issued_shares" bigint;--> statement-breakpoint
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocks" DROP COLUMN "total_shares";