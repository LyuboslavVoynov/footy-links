ALTER TABLE "PlayerClub"
  ADD COLUMN "reviewStatus" TEXT NOT NULL DEFAULT 'candidate',
  ADD COLUMN "reviewerNote" TEXT,
  ADD COLUMN "reviewedAt" TIMESTAMP(3);

CREATE INDEX "PlayerClub_reviewStatus_idx" ON "PlayerClub"("reviewStatus");

CREATE TABLE "IngestionBatch" (
  "id" TEXT NOT NULL,
  "sourceName" TEXT NOT NULL,
  "sourceReference" TEXT,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "candidateCount" INTEGER NOT NULL DEFAULT 0,
  "acceptedCount" INTEGER NOT NULL DEFAULT 0,
  "rejectedCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "IngestionBatch_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IngestionBatch_sourceName_idx" ON "IngestionBatch"("sourceName");
CREATE INDEX "IngestionBatch_createdAt_idx" ON "IngestionBatch"("createdAt");

-- Preserve the existing archive but keep it outside the human review queue.
UPDATE "PlayerClub" SET "reviewStatus" = 'archived' WHERE "sourceName" = 'wikidata';
UPDATE "PlayerClub" SET "reviewStatus" = 'approved' WHERE "sourceName" = 'representative-fixture';
UPDATE "PlayerClub" SET "reviewStatus" = 'approved' WHERE "gameEligible" = true;
