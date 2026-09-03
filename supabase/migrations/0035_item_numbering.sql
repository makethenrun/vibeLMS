-- ===========================================================================
-- 0035_item_numbering
-- Per-item flag to drop it from the automatic "module.exercise" numbering.
-- When true, the item keeps no number and the sequence continues on the next.
-- ===========================================================================

alter table public.material_items add column if not exists unnumbered boolean not null default false;
