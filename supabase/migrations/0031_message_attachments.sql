-- ===========================================================================
-- 0031_message_attachments
-- Optional single file attachment on a chat message.
-- ===========================================================================

alter table public.messages add column if not exists attachment_url text;
alter table public.messages add column if not exists attachment_name text;
