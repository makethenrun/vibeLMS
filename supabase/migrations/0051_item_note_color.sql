-- ===========================================================================
-- 0051_item_note_color
-- Per-exercise note background colour (any CSS colour, chosen with a picker).
-- Null = the default styling.
-- ===========================================================================

alter table public.material_items
  add column if not exists note_color text;
