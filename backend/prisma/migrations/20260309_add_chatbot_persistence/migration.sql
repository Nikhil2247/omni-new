-- Ensure schema exists in shadow databases
CREATE SCHEMA IF NOT EXISTS "planning";
CREATE SCHEMA IF NOT EXISTS "public";

-- Create chatbot persistence enums
CREATE TYPE "planning"."ChatbotMessageRole" AS ENUM ('user', 'assistant');
CREATE TYPE "planning"."ChatbotConversationLanguage" AS ENUM ('en', 'hi', 'hinglish');

-- Create chatbot conversation table
CREATE TABLE "planning"."chatbot_conversations" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "language" "planning"."ChatbotConversationLanguage" NOT NULL DEFAULT 'en',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "turns" INTEGER NOT NULL DEFAULT 0,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

-- Create chatbot message table
CREATE TABLE "planning"."chatbot_conversation_messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "role" "planning"."ChatbotMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_conversation_messages_pkey" PRIMARY KEY ("id")
);

-- Add constraints
ALTER TABLE "planning"."chatbot_conversations"
    ADD CONSTRAINT "chatbot_conversations_user_id_key" UNIQUE ("user_id");

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
            AND table_name = 'users'
    ) THEN
        ALTER TABLE "planning"."chatbot_conversations"
            ADD CONSTRAINT "chatbot_conversations_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

ALTER TABLE "planning"."chatbot_conversation_messages"
    ADD CONSTRAINT "chatbot_conversation_messages_conversation_id_fkey"
    FOREIGN KEY ("conversation_id") REFERENCES "planning"."chatbot_conversations"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Indexes
CREATE INDEX "chatbot_conversations_last_message_at_idx"
    ON "planning"."chatbot_conversations"("last_message_at");

CREATE INDEX "chatbot_conversation_messages_conversation_id_created_at_idx"
    ON "planning"."chatbot_conversation_messages"("conversation_id", "created_at");
