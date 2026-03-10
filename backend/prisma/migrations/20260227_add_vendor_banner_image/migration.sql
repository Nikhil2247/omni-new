-- Ensure schema exists in shadow databases
CREATE SCHEMA IF NOT EXISTS "catalog";

-- AlterTable (guarded for shadow DBs where baseline tables may not exist)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.tables
		WHERE table_schema = 'catalog'
			AND table_name = 'vendor_profiles'
	) THEN
		ALTER TABLE "catalog"."vendor_profiles"
		ADD COLUMN IF NOT EXISTS "banner_image_url" TEXT;
	END IF;
END $$;
