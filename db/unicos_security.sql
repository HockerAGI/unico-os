-- =========================================================
-- UNICOS ADMIN - SECURITY & STORAGE PATCH v2026 (FINAL)
-- =========================================================

-- 1. CREAR EL DISCO DURO (STORAGE) PARA FOTOS DE PRODUCTOS
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE
CREATE POLICY "UnicOs subida de fotos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
CREATE POLICY "UnicOs lectura de fotos" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- 3. DESBLOQUEO DE LECTURAS (Solución al "Ghost Town")
-- Permitir que el sistema cargue el selector de organizaciones
DROP POLICY IF EXISTS "Staff lee organizaciones" ON public.organizations;
CREATE POLICY "Staff lee organizaciones" ON public.organizations FOR SELECT TO authenticated USING (true);

-- Permitir que el sistema cargue los perfiles de tu equipo
DROP POLICY IF EXISTS "Staff lee equipo" ON public.admin_users;
CREATE POLICY "Staff lee equipo" ON public.admin_users FOR SELECT TO authenticated USING (true);

-- Permitir que el Dashboard y Módulo de Pedidos lean las ventas (Solo de su organización)
DROP POLICY IF EXISTS "Staff lee pedidos" ON public.orders;
CREATE POLICY "Staff lee pedidos" ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.jwt()->>'email' AND a.organization_id = orders.organization_id AND a.is_active = true)
);

-- 4. POLÍTICAS DE ESCRITURA AVANZADAS
DROP POLICY IF EXISTS "Owner/Admin actualizan usuarios" ON public.admin_users;
CREATE POLICY "Owner/Admin actualizan usuarios" ON public.admin_users FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.jwt()->>'email' AND a.organization_id = admin_users.organization_id AND a.role IN ('owner', 'admin') AND a.is_active = true)
);

DROP POLICY IF EXISTS "Roles autorizados actualizan settings" ON public.site_settings;
CREATE POLICY "Roles autorizados actualizan settings" ON public.site_settings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.jwt()->>'email' AND a.organization_id = site_settings.organization_id AND a.role IN ('owner', 'admin', 'marketing') AND a.is_active = true)
);

DROP POLICY IF EXISTS "Staff inserta productos" ON public.products;
CREATE POLICY "Staff inserta productos" ON public.products FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.jwt()->>'email' AND a.organization_id = products.organization_id AND a.role IN ('owner', 'admin', 'ops') AND a.is_active = true)
);

DROP POLICY IF EXISTS "Staff actualiza productos" ON public.products;
CREATE POLICY "Staff actualiza productos" ON public.products FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.admin_users a WHERE a.email = auth.jwt()->>'email' AND a.organization_id = products.organization_id AND a.role IN ('owner', 'admin', 'ops') AND a.is_active = true)
);