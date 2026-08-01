-- ===========================================================================
-- 0012_image_task_item_type
-- Add IMAGE_TASK: image-based exercises (drag image↔word, type/select word for
-- image, select correct images). Variant is stored inside the JSON content.
-- ===========================================================================

alter table public.material_items drop constraint if exists material_items_type_check;

alter table public.material_items
  add constraint material_items_type_check
  check (type in ('INFO','QUIZ','GAPS','FREE','MATCH','AUDIO','VIDEO','IMAGE','CAROUSEL','LINK','IMAGE_TASK'));
