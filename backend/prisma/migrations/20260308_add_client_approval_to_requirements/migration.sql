-- CreateEnum
CREATE TYPE "operations"."ClientApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "approval_token" TEXT;
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "approval_status" "operations"."ClientApprovalStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "sent_to_client_at" TIMESTAMP(3);
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "client_approved_at" TIMESTAMP(3);
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "client_rejected_at" TIMESTAMP(3);
ALTER TABLE "operations"."requirement_sheets" ADD COLUMN "rejection_reason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "requirement_sheets_approval_token_key" ON "operations"."requirement_sheets"("approval_token");

-- CreateIndex
CREATE INDEX "requirement_sheets_approval_token_idx" ON "operations"."requirement_sheets"("approval_token");
