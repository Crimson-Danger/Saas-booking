-- Enable row level security and create tenant policies
-- This script assumes all tables already exist as per prisma/schema.prisma

-- Create a custom setting to carry tenant id per session/transaction
DO $$ BEGIN
  PERFORM set_config('app.tenant_id', '', true);
EXCEPTION WHEN others THEN
  -- ignore
END $$;

-- Helper: ensure extension for gen_random_uuid if needed
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable RLS and add policies for tables with tenantId
-- The policy checks a session-local setting app.tenant_id set by the app

ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Service" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TimeOff" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Appointment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Allow all on Tenant by slug lookup only (read-only), write requires membership checks in app
DROP POLICY IF EXISTS tenant_is_visible ON "Tenant";
CREATE POLICY tenant_is_visible ON "Tenant"
  USING (id::text = current_setting('app.tenant_id', true));

-- Generic per-tenant policy template
DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['Membership','Service','Availability','TimeOff','Customer','Appointment','Notification'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS rls_policy ON "%I";', tbl);
    EXECUTE format(
      'CREATE POLICY rls_policy ON "%I" USING ("tenantId"::text = current_setting(''app.tenant_id'', true));',
      tbl
    );
  END LOOP;
END $$;

-- Optional: default deny
-- (By default RLS denies if no policy matches.)

