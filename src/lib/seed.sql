-- src/lib/seed.sql
-- =========================================================
-- UNICOS ADMIN — SEED (Multi-tenant safe) v2026-02-27
-- Objetivo: que el panel NO se vea vacío al lanzar.
-- =========================================================

BEGIN;

-- 1) Asegurar org "Score Store" si tu tabla organizations tiene slug
INSERT INTO public.organizations (name, slug)
SELECT 'Score Store', 'score-store'
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='organizations' AND column_name='slug'
)
ON CONFLICT (slug) DO NOTHING;

-- 2) Elegir organization_id destino (score-store si existe; si no, el primer org)
WITH target_org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'score-store'
  UNION ALL
  SELECT id FROM public.organizations ORDER BY created_at ASC NULLS LAST
  LIMIT 1
)
INSERT INTO public.site_settings (organization_id, hero_title, promo_active, promo_text, pixel_id)
SELECT id, 'SCORE STORE 2026', true, '🔥 ENVÍOS NACIONALES E INTERNACIONALES 🔥', NULL
FROM target_org
ON CONFLICT (organization_id) DO NOTHING;

-- 3) Producto demo (si no hay productos activos)
WITH target_org AS (
  SELECT id
  FROM public.organizations
  WHERE slug = 'score-store'
  UNION ALL
  SELECT id FROM public.organizations ORDER BY created_at ASC NULLS LAST
  LIMIT 1
)
INSERT INTO public.products (organization_id, name, sku, price_mxn, stock, category, image_url, is_active)
SELECT id, 'Gorra SCORE — Demo', 'SCORE-DEMO-CAP', 550.00, 25, 'SCORE', '/icon-512.png', true
FROM target_org
WHERE NOT EXISTS (
  SELECT 1 FROM public.products p
  WHERE p.organization_id = (SELECT id FROM target_org)
    AND p.deleted_at IS NULL
);

COMMIT;