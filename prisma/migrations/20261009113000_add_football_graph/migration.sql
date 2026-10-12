-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nationality" TEXT,
    "imageUrl" TEXT,
    "eligibleForChallenge" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Club" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerClub" (
    "playerId" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "loan" BOOLEAN NOT NULL DEFAULT false,
    "appearances" INTEGER,
    CONSTRAINT "PlayerClub_pkey" PRIMARY KEY ("playerId","clubId")
);

CREATE UNIQUE INDEX "Player_slug_key" ON "Player"("slug");
CREATE INDEX "Player_name_idx" ON "Player"("name");
CREATE INDEX "Player_eligibleForChallenge_idx" ON "Player"("eligibleForChallenge");
CREATE UNIQUE INDEX "Club_slug_key" ON "Club"("slug");
CREATE INDEX "Club_name_idx" ON "Club"("name");
CREATE INDEX "PlayerClub_clubId_idx" ON "PlayerClub"("clubId");

ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerClub" ADD CONSTRAINT "PlayerClub_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
