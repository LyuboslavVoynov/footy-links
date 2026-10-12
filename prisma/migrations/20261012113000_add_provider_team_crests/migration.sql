ALTER TABLE "Club" ADD COLUMN "providerTeamId" INTEGER;
ALTER TABLE "Club" ADD COLUMN "crestUrl" TEXT;
CREATE UNIQUE INDEX "Club_providerTeamId_key" ON "Club"("providerTeamId");
