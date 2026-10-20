SET lock_timeout='5s';
CREATE TABLE gymos.gym_activity_archive (
 owner_id text NOT NULL,event_id text NOT NULL,branch text NOT NULL,at text NOT NULL,payload jsonb NOT NULL,
 PRIMARY KEY(owner_id,event_id)
);
CREATE INDEX gym_activity_archive_scope ON gymos.gym_activity_archive(owner_id,branch,at,event_id);
ALTER TABLE gymos.gym_activity_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_activity_archive FORCE ROW LEVEL SECURITY;
CREATE POLICY activity_archive_read ON gymos.gym_activity_archive FOR SELECT TO gymos_app USING(owner_id=current_setting('app.gym_owner',true));
CREATE POLICY activity_archive_append ON gymos.gym_activity_archive FOR INSERT TO gymos_app WITH CHECK(owner_id=current_setting('app.gym_owner',true));
REVOKE ALL ON gymos.gym_activity_archive FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON gymos.gym_activity_archive TO gymos_app;
CREATE TABLE gymos.gym_backup_transfers (
 id uuid PRIMARY KEY,owner_id text NOT NULL,actor_id text NOT NULL,mode text NOT NULL CHECK(mode IN ('upload','download')),
 bytes integer NOT NULL CHECK(bytes BETWEEN 1 AND 67108864),digest text NOT NULL CHECK(digest ~ '^[a-f0-9]{64}$'),
 chunks jsonb NOT NULL DEFAULT '{}'::jsonb,expires_at timestamptz NOT NULL DEFAULT now()+interval '30 minutes'
);
CREATE INDEX gym_backup_transfers_scope ON gymos.gym_backup_transfers(owner_id,actor_id,mode,expires_at);
ALTER TABLE gymos.gym_backup_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_backup_transfers FORCE ROW LEVEL SECURITY;
CREATE POLICY backup_transfer_scope ON gymos.gym_backup_transfers TO gymos_app
 USING(owner_id=current_setting('app.gym_owner',true) AND actor_id=current_setting('app.gym_actor',true))
 WITH CHECK(owner_id=current_setting('app.gym_owner',true) AND actor_id=current_setting('app.gym_actor',true));
REVOKE ALL ON gymos.gym_backup_transfers FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON gymos.gym_backup_transfers TO gymos_app;
