-- Additive directory: existing operational partitions remain untouched.
CREATE TABLE gymos.platform_admins(user_id text PRIMARY KEY,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE gymos.commercial_plans(
 id text PRIMARY KEY,name text NOT NULL CHECK(length(name) BETWEEN 1 AND 100),currency text NOT NULL DEFAULT 'EGP',
 monthly_minor bigint,annual_minor bigint,perpetual_minor bigint,maintenance_minor bigint,
 limits jsonb NOT NULL,published boolean NOT NULL DEFAULT false,revision integer NOT NULL DEFAULT 0,
 CHECK(monthly_minor IS NULL OR monthly_minor>=0),CHECK(annual_minor IS NULL OR annual_minor>=0),
 CHECK(perpetual_minor IS NULL OR perpetual_minor>=0),CHECK(maintenance_minor IS NULL OR maintenance_minor>=0)
);
CREATE TABLE gymos.tenants(
 id text PRIMARY KEY DEFAULT gen_random_uuid()::text,storage_key text NOT NULL UNIQUE,
 name text NOT NULL CHECK(length(name) BETWEEN 1 AND 120),created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE gymos.tenant_memberships(
 tenant_id text NOT NULL REFERENCES gymos.tenants(id),user_id text NOT NULL,role text NOT NULL CHECK(role IN('owner','manager','reception')),
 branches jsonb,name text NOT NULL DEFAULT '',revoked boolean NOT NULL DEFAULT false,
 PRIMARY KEY(tenant_id,user_id)
);
CREATE INDEX tenant_memberships_user ON gymos.tenant_memberships(user_id) WHERE NOT revoked;
CREATE TABLE gymos.tenant_licenses(
 tenant_id text PRIMARY KEY REFERENCES gymos.tenants(id),plan_id text NOT NULL REFERENCES gymos.commercial_plans(id),
 mode text NOT NULL CHECK(mode IN('trial','monthly','annual','perpetual')),status text NOT NULL CHECK(status IN('pending','active','suspended')),
 starts_at timestamptz,ends_at timestamptz,maintenance_until timestamptz,
 limits jsonb NOT NULL,revision integer NOT NULL DEFAULT 0,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE gymos.activation_requests(
 id text PRIMARY KEY,tenant_id text NOT NULL REFERENCES gymos.tenants(id),user_id text NOT NULL,plan_id text NOT NULL REFERENCES gymos.commercial_plans(id),
 mode text NOT NULL CHECK(mode IN('monthly','annual','perpetual','maintenance')),
 status text NOT NULL CHECK(status IN('quote_requested','awaiting_payment','pending_review','approved','rejected','cancelled')),
 entitlements jsonb NOT NULL,expected_minor bigint,currency text NOT NULL,transfer_ref text,transfer_day date,paid_minor bigint,
 note text NOT NULL DEFAULT '',review_note text NOT NULL DEFAULT '',created_at timestamptz NOT NULL DEFAULT now(),reviewed_at timestamptz,reviewed_by text,
 CHECK(expected_minor IS NULL OR expected_minor>=0),CHECK(paid_minor IS NULL OR paid_minor>=0)
);
CREATE INDEX activation_requests_tenant_date ON gymos.activation_requests(tenant_id,created_at DESC);
CREATE INDEX activation_requests_pending ON gymos.activation_requests(status,created_at) WHERE status IN('quote_requested','pending_review');
CREATE UNIQUE INDEX activation_requests_one_open ON gymos.activation_requests(tenant_id) WHERE status IN('quote_requested','awaiting_payment','pending_review');
CREATE TABLE gymos.platform_settings(id integer PRIMARY KEY CHECK(id=1),payload jsonb NOT NULL DEFAULT '{}',revision integer NOT NULL DEFAULT 0);
CREATE TABLE gymos.commercial_audit(id text PRIMARY KEY,actor text NOT NULL,tenant_id text,action text NOT NULL,details jsonb NOT NULL DEFAULT '{}',at timestamptz NOT NULL DEFAULT now());
CREATE INDEX commercial_audit_time ON gymos.commercial_audit(at DESC);

INSERT INTO gymos.commercial_plans(id,name,limits,published) VALUES
 ('legacy','مساحة قائمة قبل التحويل التجاري','{"branches":100,"members":100000,"staff":1000}',false),
 ('custom','باقة حسب الاتفاق','{"branches":5,"members":1000,"staff":20}',true);
INSERT INTO gymos.platform_settings(id) VALUES(1);
INSERT INTO gymos.tenants(storage_key,name,created_by)
 SELECT user_id,left(coalesce(payload::jsonb->'settings'->>'name','GYM OS'),120),user_id FROM gymos.gym_states;
INSERT INTO gymos.tenant_memberships(tenant_id,user_id,role,branches,name)
 SELECT id,created_by,'owner',NULL,name FROM gymos.tenants;
INSERT INTO gymos.tenant_memberships(tenant_id,user_id,role,branches,name,revoked)
 SELECT t.id,a.user_id,a.role,a.branches::jsonb,a.name,a.revoked<>0 FROM gymos.gym_access a JOIN gymos.tenants t ON t.storage_key=a.owner_id
 ON CONFLICT(tenant_id,user_id) DO NOTHING;
INSERT INTO gymos.tenant_licenses(tenant_id,plan_id,mode,status,starts_at,limits)
 SELECT id,'legacy','perpetual','active',now(),'{"branches":100,"members":100000,"staff":1000}'::jsonb FROM gymos.tenants;

-- Runtime receives only verified actor / tenant context from server transactions.
DO $rls$ DECLARE table_name text;BEGIN
 FOREACH table_name IN ARRAY ARRAY['platform_admins','commercial_plans','tenants','tenant_memberships','tenant_licenses','activation_requests','platform_settings','commercial_audit'] LOOP
  EXECUTE format('ALTER TABLE gymos.%I ENABLE ROW LEVEL SECURITY',table_name);
  EXECUTE format('ALTER TABLE gymos.%I FORCE ROW LEVEL SECURITY',table_name);
  EXECUTE format('REVOKE ALL ON gymos.%I FROM PUBLIC,anon,authenticated',table_name);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON gymos.%I TO gymos_app',table_name);
 END LOOP;
END $rls$;
CREATE POLICY platform_admin_self ON gymos.platform_admins FOR SELECT TO gymos_app USING(user_id=current_setting('app.actor',true));
REVOKE INSERT,UPDATE,DELETE ON gymos.platform_admins FROM gymos_app;
CREATE POLICY tenants_runtime ON gymos.tenants TO gymos_app USING(id=current_setting('app.tenant',true) OR storage_key=current_setting('app.gym_owner',true) OR current_setting('app.platform',true)='1') WITH CHECK(id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1');
CREATE POLICY memberships_runtime ON gymos.tenant_memberships TO gymos_app USING(user_id=current_setting('app.actor',true) OR tenant_id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1' OR tenant_id IN(SELECT id FROM gymos.tenants WHERE storage_key=current_setting('app.gym_owner',true))) WITH CHECK(tenant_id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1' OR tenant_id IN(SELECT id FROM gymos.tenants WHERE storage_key=current_setting('app.gym_owner',true)));
CREATE POLICY licenses_read ON gymos.tenant_licenses FOR SELECT TO gymos_app USING(tenant_id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1' OR tenant_id IN(SELECT id FROM gymos.tenants WHERE storage_key=current_setting('app.gym_owner',true)));
CREATE POLICY licenses_write ON gymos.tenant_licenses FOR ALL TO gymos_app USING(current_setting('app.platform',true)='1') WITH CHECK(current_setting('app.platform',true)='1');
CREATE POLICY licenses_pending ON gymos.tenant_licenses FOR INSERT TO gymos_app WITH CHECK(tenant_id=current_setting('app.tenant',true) AND status='pending' AND EXISTS(SELECT 1 FROM gymos.tenant_memberships m WHERE m.tenant_id=tenant_licenses.tenant_id AND m.user_id=current_setting('app.actor',true) AND m.role='owner' AND NOT m.revoked));
CREATE POLICY plans_read ON gymos.commercial_plans FOR SELECT TO gymos_app USING(published OR current_setting('app.platform',true)='1' OR id IN(SELECT plan_id FROM gymos.tenant_licenses));
CREATE POLICY plans_write ON gymos.commercial_plans FOR ALL TO gymos_app USING(current_setting('app.platform',true)='1') WITH CHECK(current_setting('app.platform',true)='1');
CREATE POLICY requests_runtime ON gymos.activation_requests TO gymos_app USING(tenant_id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1') WITH CHECK(tenant_id=current_setting('app.tenant',true) OR current_setting('app.platform',true)='1');
CREATE POLICY settings_read ON gymos.platform_settings FOR SELECT TO gymos_app USING(true);
CREATE POLICY settings_write ON gymos.platform_settings FOR ALL TO gymos_app USING(current_setting('app.platform',true)='1') WITH CHECK(current_setting('app.platform',true)='1');
CREATE POLICY audit_read ON gymos.commercial_audit FOR SELECT TO gymos_app USING(current_setting('app.platform',true)='1');
CREATE POLICY audit_append ON gymos.commercial_audit FOR INSERT TO gymos_app WITH CHECK(actor=current_setting('app.actor',true));
REVOKE UPDATE,DELETE ON gymos.commercial_audit FROM gymos_app;

-- Keep legacy staff screens synchronized during the additive migration.
CREATE FUNCTION gymos.sync_tenant_staff() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,gymos AS $fn$
DECLARE tenant_key text; license_row gymos.tenant_licenses%ROWTYPE; staff_count integer;BEGIN
 SELECT id INTO tenant_key FROM gymos.tenants WHERE storage_key=NEW.owner_id;
 IF tenant_key IS NOT NULL THEN
  PERFORM id FROM gymos.tenants WHERE id=tenant_key FOR UPDATE;
  SELECT * INTO license_row FROM gymos.tenant_licenses WHERE tenant_id=tenant_key;
  IF license_row.status<>'active' OR license_row.starts_at IS NULL OR license_row.starts_at>now() OR (license_row.mode<>'perpetual' AND (license_row.ends_at IS NULL OR license_row.ends_at<=now())) THEN RAISE EXCEPTION 'licenseReadOnly' USING ERRCODE='42501';END IF;
  IF NEW.revoked=0 AND NOT EXISTS(SELECT 1 FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND user_id=NEW.user_id AND NOT revoked) THEN
   SELECT count(*) INTO staff_count FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND NOT revoked AND role<>'owner';
   IF staff_count>=(license_row.limits->>'staff')::integer THEN RAISE EXCEPTION 'staffLimit' USING ERRCODE='42501';END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND user_id=NEW.user_id AND role='owner' AND NOT revoked) THEN RAISE EXCEPTION 'owner_protected' USING ERRCODE='42501';END IF;
  INSERT INTO gymos.tenant_memberships(tenant_id,user_id,role,branches,name,revoked) VALUES(tenant_key,NEW.user_id,NEW.role,NEW.branches::jsonb,NEW.name,NEW.revoked<>0)
  ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role,branches=excluded.branches,name=excluded.name,revoked=excluded.revoked;
 END IF;RETURN NEW;END $fn$;
CREATE TRIGGER sync_tenant_staff AFTER INSERT OR UPDATE ON gymos.gym_access FOR EACH ROW EXECUTE FUNCTION gymos.sync_tenant_staff();
