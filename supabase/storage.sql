-- ===========================================================================
-- pLMS — Supabase Storage setup
-- ---------------------------------------------------------------------------
-- Creates a public bucket for materials and homework files. Uploads are
-- performed server-side with the service-role key (which bypasses storage
-- RLS), so no additional storage policies are required. Files are served via
-- public URLs.
--
-- The bucket name MUST match SUPABASE_STORAGE_BUCKET in your .env.local
-- (default: "plms"). Change the literal below if you use a different name.
--
-- Run this in the Supabase SQL editor after schema.sql. Idempotent.
-- ===========================================================================

insert into storage.buckets (id, name, public)
values ('plms', 'plms', true)
on conflict (id) do update set public = excluded.public;
