CREATE TABLE gymos.trial_claims(
 owner_id text PRIMARY KEY,tenant_id text NOT NULL UNIQUE REFERENCES gymos.tenants(id),
 starts_at timestamptz NOT NULL,ends_at timestamptz NOT NULL,
 CHECK(ends_at=starts_at+interval '720 hours')
);
ALTER TABLE gymos.trial_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.trial_claims FORCE ROW LEVEL SECURITY;
CREATE POLICY trial_read ON gymos.trial_claims FOR SELECT TO gymos_app
 USING(owner_id=current_setting('app.actor',true) OR current_setting('app.platform',true)='1');
REVOKE ALL ON gymos.trial_claims FROM PUBLIC,anon,authenticated,gymos_app;
GRANT SELECT ON gymos.trial_claims TO gymos_app;
-- Narrow privilege boundary: runtime may claim its own unused trial, never edit a license directly.
CREATE FUNCTION gymos.start_public_trial(target text) RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos AS $$
DECLARE actor text:=current_setting('app.actor',true); current_license gymos.tenant_licenses%ROWTYPE;
 started timestamptz:=clock_timestamp(); expires timestamptz;
BEGIN
 IF actor IS NULL OR actor='' OR NOT EXISTS(SELECT 1 FROM gymos.tenants t
 JOIN gymos.tenant_memberships m ON m.tenant_id=t.id
 WHERE t.id=target AND t.created_by=actor AND m.user_id=actor AND m.role='owner' AND NOT m.revoked)
 THEN RAISE EXCEPTION 'trial_forbidden' USING ERRCODE='42501'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('public-trial:'||actor,0));
 PERFORM 1 FROM gymos.tenants WHERE id=target FOR UPDATE;
 SELECT * INTO current_license FROM gymos.tenant_licenses WHERE tenant_id=target FOR UPDATE;
 IF EXISTS(SELECT 1 FROM gymos.trial_claims WHERE owner_id=actor OR tenant_id=target)
 THEN RAISE EXCEPTION 'trial_used' USING ERRCODE='P0001'; END IF;
 IF current_license.tenant_id IS NULL OR current_license.status<>'pending' OR current_license.starts_at IS NOT NULL
 THEN RAISE EXCEPTION 'trial_unavailable' USING ERRCODE='P0001'; END IF;
 expires:=started+interval '720 hours';
 INSERT INTO gymos.trial_claims VALUES(actor,target,started,expires);
 UPDATE gymos.tenant_licenses SET mode='trial',status='active',starts_at=started,ends_at=expires,
 maintenance_until=NULL,limits='{"branches":1,"members":1000,"staff":5}',revision=revision+1,updated_at=started
 WHERE tenant_id=target;
 INSERT INTO gymos.commercial_audit(id,actor,tenant_id,action,details)
 VALUES(gen_random_uuid()::text,actor,target,'trial.started',jsonb_build_object('startsAt',started,'endsAt',expires));
 RETURN jsonb_build_object('startsAt',started,'endsAt',expires);
END $$;
REVOKE ALL ON FUNCTION gymos.start_public_trial(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.start_public_trial(text) TO gymos_app;
