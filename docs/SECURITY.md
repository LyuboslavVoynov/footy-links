# Database access and Row-Level Security

Football Links does not use the Supabase browser client or expose Supabase credentials to client code. The application accesses PostgreSQL only from server-side Next.js routes and scripts through Prisma.

Every public-schema application table has Row-Level Security enabled. There are intentionally no policies for Supabase's `anon` or `authenticated` roles, so a visitor who knows the project URL cannot read, insert, update, or delete game data through Supabase's Data API.

The Prisma database role continues to access the database from trusted server-side code. Do not add broad public RLS policies. Any future direct client access must be introduced with a narrowly scoped, tested policy and an explicit security review.
