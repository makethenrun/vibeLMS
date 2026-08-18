-- ===========================================================================
-- 0024_session_scope
-- Let a live session broadcast a whole section / lesson / module (all its
-- exercises), not just a single item. active_kind says what active_node_id
-- points at; for 'item' the existing active_item_id is used instead.
-- ===========================================================================

alter table public.live_sessions add column if not exists active_kind text not null default 'item';
alter table public.live_sessions add column if not exists active_node_id uuid;
