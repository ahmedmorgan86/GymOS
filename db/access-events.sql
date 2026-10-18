CREATE TABLE IF NOT EXISTS gymos.gym_access_events (
 id text PRIMARY KEY, owner_id text NOT NULL, actor text NOT NULL,
 target text NOT NULL, action text NOT NULL, at timestamptz NOT NULL DEFAULT now(),
 details jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS gym_access_events_owner_time ON gymos.gym_access_events(owner_id,at DESC);
ALTER TABLE gymos.gym_access_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_access_events FORCE ROW LEVEL SECURITY;
DO $policy$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='gymos' AND tablename='gym_access_events' AND policyname='gym_access_events_runtime') THEN CREATE POLICY gym_access_events_runtime ON gymos.gym_access_events TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true)); END IF; END $policy$;
REVOKE ALL ON gymos.gym_access_events FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON gymos.gym_access_events TO gymos_app;

REVOKE DELETE,UPDATE ON gymos.gym_access_events FROM gymos_app;
