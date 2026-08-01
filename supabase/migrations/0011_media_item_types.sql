-- ===========================================================================
-- 0011_media_item_types
-- Add media item formats: VIDEO (embed by URL), IMAGE, CAROUSEL, LINK.
-- (AUDIO becomes questionless — a content-shape change only, no enum change.)
-- ===========================================================================

alter table public.material_items drop constraint if exists material_items_type_check;

alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO','VIDEO','IMAGE','CAROUSEL','LINK'));
