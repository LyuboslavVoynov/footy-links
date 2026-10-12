ALTER TABLE "Club" ADD COLUMN "gameEligible" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PlayerClub" ADD COLUMN "gameEligible" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "PlayerClub_gameEligible_idx" ON "PlayerClub"("gameEligible");
