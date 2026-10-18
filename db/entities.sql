CREATE TABLE IF NOT EXISTS gymos.gym_entities (
 owner_id text NOT NULL, collection text NOT NULL, entity_id text NOT NULL,
 position integer NOT NULL DEFAULT 0, branch text, payload jsonb NOT NULL,
 PRIMARY KEY(owner_id,collection,entity_id)
);
CREATE INDEX IF NOT EXISTS gym_entities_owner_branch ON gymos.gym_entities(owner_id,branch,collection);
CREATE TABLE IF NOT EXISTS gymos.gym_photos (
 owner_id text NOT NULL, member_id text NOT NULL, content text NOT NULL,
 PRIMARY KEY(owner_id,member_id), CHECK(length(content)<=22000)
);
ALTER TABLE gymos.gym_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_entities FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.gym_photos FORCE ROW LEVEL SECURITY;
DO $policy$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='gymos' AND tablename='gym_entities' AND policyname='gym_entities_runtime') THEN CREATE POLICY gym_entities_runtime ON gymos.gym_entities TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true)); END IF; END $policy$;
DO $policy$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='gymos' AND tablename='gym_photos' AND policyname='gym_photos_runtime') THEN CREATE POLICY gym_photos_runtime ON gymos.gym_photos TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true)); END IF; END $policy$;
REVOKE ALL ON gymos.gym_entities,gymos.gym_photos FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON gymos.gym_entities,gymos.gym_photos TO gymos_app;
