-- src/lib/seed.sql
-- =========================================================
-- UNICOS / SCORE STORE — SEED (IDEMPOTENT) v2026-02-27
-- =========================================================

BEGIN;

-- 1) Organización Score Store (ID fijo para alinear todo)
INSERT INTO public.organizations (id, name, slug, metadata)
VALUES (
  '1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6'::uuid,
  'Score Store',
  'score-store',
  jsonb_build_object('source','seed.sql','created','2026-02-27')
)
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  slug = COALESCE(NULLIF(public.organizations.slug,''), EXCLUDED.slug),
  metadata = public.organizations.metadata || EXCLUDED.metadata;

-- 2) site_settings (organization_id)
INSERT INTO public.site_settings (organization_id, hero_title, promo_active, promo_text, pixel_id, updated_at)
VALUES (
  '1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6'::uuid,
  'SCORE STORE 2026',
  true,
  '🔥 ENVÍOS NACIONALES E INTERNACIONALES 🔥',
  NULL,
  now()
)
ON CONFLICT (organization_id) DO UPDATE
SET
  hero_title = EXCLUDED.hero_title,
  promo_active = EXCLUDED.promo_active,
  promo_text = EXCLUDED.promo_text,
  pixel_id = EXCLUDED.pixel_id,
  updated_at = now();

-- 3) Producto demo (para que Products no esté vacío)
INSERT INTO public.products (organization_id, name, sku, price_mxn, stock, category, image_url, is_active)
VALUES (
  '1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6'::uuid,
  'Camiseta Baja 1000 — Demo',
  'DEMO-BAJA1000',
  550.00,
  100,
  'BAJA_1000',
  '/assets/logo-score.webp',
  true
)
ON CONFLICT DO NOTHING;

-- 4) Admin user (EDITA el correo)
-- Nota: user_id puede quedar NULL, RLS también valida por email.
INSERT INTO public.admin_users (organization_id, email, role, is_active)
VALUES (
  '1f3b9980-a1c5-4557-b4eb-a75bb9a8aaa6'::uuid,
  'TU_CORREO_AQUI@tudominio.com',
  'owner',
  true
)
ON CONFLICT (organization_id, email) DO UPDATE
SET role = EXCLUDED.role, is_active = true;

COMMIT;