-- Safe migration to add AuthProvider enum and auth_provider column
-- This migration is safe and won't delete any data

-- Create AuthProvider enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AuthProvider' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
        CREATE TYPE "public"."AuthProvider" AS ENUM ('LOCAL', 'GOOGLE');
    END IF;
END
$$;

-- Add auth_provider column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'auth_provider'
    ) THEN
        ALTER TABLE "public"."users" ADD COLUMN "auth_provider" "public"."AuthProvider" NOT NULL DEFAULT 'LOCAL';
    END IF;
END
$$;

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS "users_auth_provider_idx" ON "public"."users"("auth_provider");
