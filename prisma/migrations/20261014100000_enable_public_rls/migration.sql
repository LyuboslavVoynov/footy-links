-- Football Links accesses PostgreSQL only through the server-side Prisma
-- connection. No browser client needs direct access to public-schema tables.
-- With RLS enabled and no public policies, Supabase anon/authenticated roles
-- cannot read or mutate gameplay or intake data through the Data API.

ALTER TABLE public."Player" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PlayerClub" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IngestionBatch" ENABLE ROW LEVEL SECURITY;

-- Prisma owns this metadata table through the server database role. Protect it
-- from any accidental exposure through Supabase's public schema as well.
ALTER TABLE public."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
