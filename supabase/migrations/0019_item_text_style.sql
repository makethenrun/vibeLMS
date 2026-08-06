-- ===========================================================================
-- 0019_item_text_style
-- Per-exercise text styling that persists and is shown to students.
-- NULL means "inherit the default".
-- ===========================================================================

alter table public.material_items add column if not exists font_family text;
alter table public.material_items add column if not exists font_size text;
