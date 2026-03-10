-- Fix: Remove unique constraint on user_id to allow multiple conversations per user
-- Run this in your PostgreSQL database

ALTER TABLE "planning"."chatbot_conversations"
DROP CONSTRAINT IF EXISTS "chatbot_conversations_user_id_key";

-- Verify the constraint was removed
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = '"planning"."chatbot_conversations"'::regclass;
