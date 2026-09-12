-- ===========================================================================
-- 0041_payment_requests
-- Students submit a payment mark (amount + number of lessons) that a tutor or
-- administrator confirms or rejects. Existing rows stay CONFIRMED.
-- ===========================================================================

alter table public.payments add column if not exists lessons integer;
alter table public.payments add column if not exists status text not null default 'CONFIRMED';
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments
  add constraint payments_status_check check (status in ('PENDING', 'CONFIRMED', 'REJECTED'));
