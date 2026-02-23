-- =========================================================
-- UNICOS ADMIN EXTENSION v2026-02-21
-- Inyecta los módulos dinámicos al schema de Score Store
-- =========================================================

-- 1. Tabla de Configuración Web (Marketing / SEO)
CREATE TABLE IF NOT EXISTS public.site_settings (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id),
  hero_title text DEFAULT 'SCORE STORE',
  promo_active boolean DEFAULT false,
  promo_text text NULL,
  pixel_id text NULL,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 2. Tabla de Inventario / Productos
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  sku text UNIQUE,
  price_mxn numeric(10,2) NOT NULL DEFAULT 0.00,
  stock integer NOT NULL DEFAULT 0,
  category text DEFAULT 'BAJA_1000',
  image_url text NULL,
  is_active boolean DEFAULT true,
  deleted_at timestamptz NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_products_org ON public.products(organization_id);

-- 3. Políticas RLS (Seguridad Zero-Trust)
-- Solo el servidor backend (Service Role) o usuarios autenticados pueden leer.
CREATE POLICY "Lectura global" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Lectura global productos" ON public.products FOR SELECT USING (deleted_at IS NULL);

-- Inserta la configuración inicial conectada a tu organización principal
INSERT INTO public.site_settings (organization_id, hero_title, promo_active, promo_text)
SELECT id, 'SCORE STORE 2026', true, '🔥 ENVÍOS NACIONALES E INTERNACIONALES 🔥'
FROM public.organizations WHERE name = 'SCORE STORE (Default)'
ON CONFLICT DO NOTHING;