-- Deploy scoped server reads first. These policies also protect legacy partitions.
DROP POLICY server_access ON gymos.gym_states;
CREATE POLICY partition_runtime ON gymos.gym_states TO gymos_app
 USING(user_id=current_setting('app.gym_owner',true))
 WITH CHECK(user_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_recovery;
CREATE POLICY partition_runtime ON gymos.gym_recovery TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_access;
CREATE POLICY partition_runtime ON gymos.gym_access TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
DROP POLICY server_access ON gymos.gym_invites;
CREATE POLICY invitation_read ON gymos.gym_invites FOR SELECT TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true) OR token_hash=current_setting('app.invite_token',true));
CREATE POLICY invitation_write ON gymos.gym_invites FOR ALL TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true));
ALTER TABLE gymos.gym_states FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_recovery FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_access FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_invites FORCE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX activation_requests_unique_transfer ON gymos.activation_requests(upper(regexp_replace(transfer_ref,'[[:space:]]','','g')),currency) WHERE status='approved' AND transfer_ref IS NOT NULL;

-- Security revocation remains available even when a license is suspended.
CREATE OR REPLACE FUNCTION gymos.sync_tenant_staff() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,gymos AS $fn$
DECLARE tenant_key text; license_row gymos.tenant_licenses%ROWTYPE; staff_count integer;BEGIN
 SELECT id INTO tenant_key FROM gymos.tenants WHERE storage_key=NEW.owner_id;
 IF tenant_key IS NOT NULL THEN
  PERFORM id FROM gymos.tenants WHERE id=tenant_key FOR UPDATE;
  SELECT * INTO license_row FROM gymos.tenant_licenses WHERE tenant_id=tenant_key;
  IF NEW.revoked=0 AND (license_row.status<>'active' OR license_row.starts_at IS NULL OR license_row.starts_at>now() OR (license_row.mode<>'perpetual' AND (license_row.ends_at IS NULL OR license_row.ends_at<=now()))) THEN RAISE EXCEPTION 'licenseReadOnly' USING ERRCODE='42501';END IF;
  IF NEW.revoked=0 AND NOT EXISTS(SELECT 1 FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND user_id=NEW.user_id AND NOT revoked) THEN
   SELECT count(*) INTO staff_count FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND NOT revoked AND role<>'owner';
   IF staff_count>=(license_row.limits->>'staff')::integer THEN RAISE EXCEPTION 'staffLimit' USING ERRCODE='42501';END IF;
  END IF;
  IF EXISTS(SELECT 1 FROM gymos.tenant_memberships WHERE tenant_id=tenant_key AND user_id=NEW.user_id AND role='owner' AND NOT revoked) THEN RAISE EXCEPTION 'owner_protected' USING ERRCODE='42501';END IF;
  INSERT INTO gymos.tenant_memberships(tenant_id,user_id,role,branches,name,revoked) VALUES(tenant_key,NEW.user_id,NEW.role,NEW.branches::jsonb,NEW.name,NEW.revoked<>0)
  ON CONFLICT(tenant_id,user_id) DO UPDATE SET role=excluded.role,branches=excluded.branches,name=excluded.name,revoked=excluded.revoked;
 END IF;RETURN NEW;END $fn$;

CREATE INDEX tenant_licenses_plan ON gymos.tenant_licenses(plan_id);
CREATE INDEX activation_requests_plan ON gymos.activation_requests(plan_id);
