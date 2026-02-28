-- db/unicos_audit.sql
-- =========================================================
-- UNICOS ADMIN — AUDIT LOG v2026-02-27
-- =========================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  organization_id uuid NOT NULL REFERENCES public.organizations(id),

  actor_email text NULL,
  actor_user_id uuid NULL,

  action text NOT NULL,                 -- e.g. "orders.update_status"
  entity text NULL,                     -- e.g. "orders"
  entity_id text NULL,                  -- e.g. order uuid
  summary text NULL,                    -- short human note

  before jsonb NULL,
  after jsonb NULL,
  meta jsonb NULL,

  ip text NULL,
  user_agent text NULL
);

CREATE INDEX IF NOT EXISTS audit_log_org_created_at_idx
  ON public.audit_log (organization_id, created_at DESC);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Leer audit: solo owner/admin de esa org
DROP POLICY IF EXISTS "UnicOs lee audit_log" ON public.audit_log;
CREATE POLICY "UnicOs lee audit_log"
ON public.audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users a
    WHERE a.organization_id = audit_log.organization_id
      AND a.is_active = true
      AND a.role IN ('owner','admin')
      AND (
        (a.user_id IS NOT NULL AND a.user_id = auth.uid())
        OR
        (a.email IS NOT NULL AND lower(trim(a.email)) = lower(coalesce(auth.jwt()->>'email', auth.jwt()->'user_metadata'->>'email','')))
      )
  )
);

-- Inserts/updates desde cliente: bloqueados (server role bypass igual puede insertar)
DROP POLICY IF EXISTS "Bloquea insert audit_log" ON public.audit_log;
CREATE POLICY "Bloquea insert audit_log"
ON public.audit_log
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "Bloquea update audit_log" ON public.audit_log;
CREATE POLICY "Bloquea update audit_log"
ON public.audit_log
FOR UPDATE
TO authenticated
USING (false);

COMMIT;