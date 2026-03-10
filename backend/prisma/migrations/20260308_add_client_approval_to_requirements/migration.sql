-- Ensure schema exists in shadow databases
CREATE SCHEMA IF NOT EXISTS "operations";

-- Create enum safely
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE t.typname = 'ClientApprovalStatus'
			AND n.nspname = 'operations'
	) THEN
		CREATE TYPE "operations"."ClientApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
	END IF;
END $$;

-- Alter table only when requirement_sheets exists
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'operations'
			AND table_name = 'requirement_sheets'
	) THEN
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "approval_token" TEXT;
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "approval_status" "operations"."ClientApprovalStatus" NOT NULL DEFAULT 'DRAFT';
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "sent_to_client_at" TIMESTAMP(3);
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "client_approved_at" TIMESTAMP(3);
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "client_rejected_at" TIMESTAMP(3);
		ALTER TABLE "operations"."requirement_sheets" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;

		CREATE UNIQUE INDEX IF NOT EXISTS "requirement_sheets_approval_token_key" ON "operations"."requirement_sheets"("approval_token");
		CREATE INDEX IF NOT EXISTS "requirement_sheets_approval_token_idx" ON "operations"."requirement_sheets"("approval_token");
	END IF;
END $$;
