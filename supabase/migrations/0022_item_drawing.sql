-- ===========================================================================
-- 0022_item_drawing
-- Saved freehand annotation drawn by the tutor over the student view of an
-- exercise (PNG data URL). Shown as an overlay to students.
-- ===========================================================================

alter table public.material_items add column if not exists drawing text;
