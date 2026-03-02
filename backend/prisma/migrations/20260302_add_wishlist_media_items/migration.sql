-- Support media-item wishlisting in addition to vendor-profile wishlisting
ALTER TABLE "planning"."wishlist_items"
  ALTER COLUMN "vendor_profile_id" DROP NOT NULL;

ALTER TABLE "planning"."wishlist_items"
  ADD COLUMN IF NOT EXISTS "media_item_id" UUID;

CREATE INDEX IF NOT EXISTS "wishlist_items_media_item_id_idx"
  ON "planning"."wishlist_items"("media_item_id");

CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_wishlist_id_media_item_id_key"
  ON "planning"."wishlist_items"("wishlist_id", "media_item_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_schema = 'planning'
      AND table_name = 'wishlist_items'
      AND constraint_name = 'wishlist_items_media_item_id_fkey'
  ) THEN
    ALTER TABLE "planning"."wishlist_items"
      ADD CONSTRAINT "wishlist_items_media_item_id_fkey"
      FOREIGN KEY ("media_item_id") REFERENCES "catalog"."media_items"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
