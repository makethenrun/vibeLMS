-- ===========================================================================
-- 0034_cards_item_type
-- Allow the new CARDS ("Случайные карточки") exercise type.
-- ===========================================================================

alter table public.material_items drop constraint if exists material_items_type_check;
alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO','VIDEO','IMAGE','CAROUSEL','LINK','IMAGE_TASK','SENTENCE_TASK','CARDS'));
