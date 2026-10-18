CREATE SCHEMA IF NOT EXISTS gymos;
REVOKE ALL ON SCHEMA gymos FROM PUBLIC,anon,authenticated;
CREATE TABLE IF NOT EXISTS gymos.gym_states(user_id text PRIMARY KEY,payload text NOT NULL,revision integer NOT NULL DEFAULT 0,updated_at text NOT NULL);
CREATE TABLE IF NOT EXISTS gymos.gym_access(owner_id text NOT NULL,user_id text NOT NULL,name text NOT NULL,role text NOT NULL CHECK(role IN ('manager','reception')),branches text NOT NULL,revoked integer NOT NULL DEFAULT 0,PRIMARY KEY(owner_id,user_id));
CREATE TABLE IF NOT EXISTS gymos.gym_invites(token_hash text PRIMARY KEY,owner_id text NOT NULL,role text NOT NULL CHECK(role IN ('manager','reception')),branches text NOT NULL,expires_at text NOT NULL,claimed_by text);
CREATE TABLE IF NOT EXISTS gymos.gym_recovery(id text PRIMARY KEY,owner_id text NOT NULL,payload text NOT NULL,created_at text NOT NULL);
CREATE INDEX IF NOT EXISTS gym_recovery_owner_date ON gymos.gym_recovery(owner_id,created_at DESC);

ALTER TABLE gymos.gym_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_recovery ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA gymos FROM PUBLIC,anon,authenticated;

GRANT USAGE ON SCHEMA gymos TO gymos_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA gymos TO gymos_app;
GRANT USAGE ON SCHEMA auth TO gymos_app;
GRANT SELECT(id,user_id) ON auth.sessions TO gymos_app;
DROP POLICY IF EXISTS server_access ON gymos.gym_states;
CREATE POLICY server_access ON gymos.gym_states TO gymos_app USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS server_access ON gymos.gym_access;
CREATE POLICY server_access ON gymos.gym_access TO gymos_app USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS server_access ON gymos.gym_invites;
CREATE POLICY server_access ON gymos.gym_invites TO gymos_app USING(true) WITH CHECK(true);
DROP POLICY IF EXISTS server_access ON gymos.gym_recovery;
CREATE POLICY server_access ON gymos.gym_recovery TO gymos_app USING(true) WITH CHECK(true);
