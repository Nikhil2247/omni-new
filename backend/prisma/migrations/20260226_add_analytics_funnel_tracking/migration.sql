-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "analytics";

-- CreateTable
CREATE TABLE "analytics"."funnel_events" (
    "id" UUID NOT NULL,
    "funnel_name" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "user_id" UUID,
    "session_id" TEXT NOT NULL,
    "anonymous_id" TEXT,
    "metadata" JSONB,
    "user_agent" TEXT,
    "ip_address" TEXT,
    "referrer" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "funnel_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "funnel_events_funnel_name_timestamp_idx" ON "analytics"."funnel_events"("funnel_name", "timestamp");

-- CreateIndex
CREATE INDEX "funnel_events_user_id_funnel_name_timestamp_idx" ON "analytics"."funnel_events"("user_id", "funnel_name", "timestamp");

-- CreateIndex
CREATE INDEX "funnel_events_session_id_funnel_name_step_index_idx" ON "analytics"."funnel_events"("session_id", "funnel_name", "step_index");

-- CreateIndex
CREATE INDEX "funnel_events_timestamp_idx" ON "analytics"."funnel_events"("timestamp");

-- AddForeignKey
ALTER TABLE "analytics"."funnel_events" ADD CONSTRAINT "funnel_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
