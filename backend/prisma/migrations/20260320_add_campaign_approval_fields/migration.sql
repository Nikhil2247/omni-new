-- Safe migration to add campaign approval workflow fields and ad credits
-- This migration does NOT drop any data

-- Add ad_credits to vendor_profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'catalog'
        AND table_name = 'vendor_profiles'
        AND column_name = 'ad_credits'
    ) THEN
        ALTER TABLE "catalog"."vendor_profiles" ADD COLUMN "ad_credits" INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add approval workflow fields to campaigns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'submitted_at'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "submitted_at" TIMESTAMP(3);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "approved_at" TIMESTAMP(3);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'approved_by_id'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "approved_by_id" UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'rejected_at'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "rejected_at" TIMESTAMP(3);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'rejected_by_id'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "rejected_by_id" UUID;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'rejection_reason'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "rejection_reason" TEXT;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'subscription'
        AND table_name = 'campaigns'
        AND column_name = 'internal_notes'
    ) THEN
        ALTER TABLE "subscription"."campaigns" ADD COLUMN "internal_notes" TEXT;
    END IF;
END $$;

-- Add foreign key constraints for approved_by and rejected_by
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'campaigns_approved_by_id_fkey'
        AND table_schema = 'subscription'
    ) THEN
        ALTER TABLE "subscription"."campaigns"
        ADD CONSTRAINT "campaigns_approved_by_id_fkey"
        FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'campaigns_rejected_by_id_fkey'
        AND table_schema = 'subscription'
    ) THEN
        ALTER TABLE "subscription"."campaigns"
        ADD CONSTRAINT "campaigns_rejected_by_id_fkey"
        FOREIGN KEY ("rejected_by_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add indexes for approval fields
CREATE INDEX IF NOT EXISTS "campaigns_approved_by_id_idx" ON "subscription"."campaigns"("approved_by_id");
CREATE INDEX IF NOT EXISTS "campaigns_rejected_by_id_idx" ON "subscription"."campaigns"("rejected_by_id");
