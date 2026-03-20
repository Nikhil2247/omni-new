-- Safe migration to sync subscription schema with database
-- This migration does NOT drop any data - only adds missing elements

-- Add new enum values to CampaignStatus if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_APPROVAL' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'subscription'))) THEN
        ALTER TYPE "subscription"."CampaignStatus" ADD VALUE 'PENDING_APPROVAL';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'APPROVED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'subscription'))) THEN
        ALTER TYPE "subscription"."CampaignStatus" ADD VALUE 'APPROVED';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'REJECTED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'CampaignStatus' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'subscription'))) THEN
        ALTER TYPE "subscription"."CampaignStatus" ADD VALUE 'REJECTED';
    END IF;
END $$;

-- Add ENTERPRISE to UserPlanTier if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ENTERPRISE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserPlanTier' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'subscription'))) THEN
        ALTER TYPE "subscription"."UserPlanTier" ADD VALUE 'ENTERPRISE';
    END IF;
END $$;

-- Note: All existing tables (campaigns, ad_credit_transactions, user_subscriptions, etc.)
-- are already in the database and schema is now synced with them.
-- Unique constraints already exist, no need to add them.
-- No DROP statements are executed to preserve data.
