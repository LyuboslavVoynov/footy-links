import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "prisma/migrations/20261014100000_enable_public_rls/migration.sql"),
  "utf8",
);

describe("public-schema row-level security", () => {
  it("enables RLS for every application-owned public table", () => {
    for (const table of ["Player", "Club", "PlayerClub", "MediaAsset", "IngestionBatch", "_prisma_migrations"]) {
      expect(migration).toContain(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
    }
  });

  it("does not grant browser-facing read or write policies", () => {
    expect(migration).not.toMatch(/CREATE\s+POLICY/i);
  });
});
