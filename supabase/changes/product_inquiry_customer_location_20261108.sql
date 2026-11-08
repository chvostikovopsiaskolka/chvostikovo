-- 2026-11-08: backward-compatible location for product inquiries.
-- NULL preserves existing rows and older client payloads. No RLS/policy changes.
ALTER TABLE public.product_inquiries
  ADD COLUMN IF NOT EXISTS customer_location text;

COMMENT ON COLUMN public.product_inquiries.customer_location IS
  'Customer-supplied city and postal code as a single comma-separated value (e.g. Košice, 040 01).';
