CREATE TABLE gymos.member_portal_access (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id) ON DELETE CASCADE,
 member_id text NOT NULL, branch text NOT NULL, user_id text, email text NOT NULL,
 invite_hash text UNIQUE, expires_at timestamptz NOT NULL, revoked boolean NOT NULL DEFAULT false,
 PRIMARY KEY(owner_id,member_id)
);
CREATE UNIQUE INDEX member_portal_user_per_club ON gymos.member_portal_access(owner_id,user_id) WHERE user_id IS NOT NULL AND NOT revoked;
ALTER TABLE gymos.member_portal_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_portal_access FORCE ROW LEVEL SECURITY;
CREATE POLICY member_portal_read ON gymos.member_portal_access FOR SELECT TO gymos_app USING (
 owner_id=current_setting('app.gym_owner',true) OR (user_id=current_setting('app.actor',true) AND NOT revoked) OR (invite_hash=current_setting('app.member_invite',true) AND NOT revoked AND expires_at>now())
);
CREATE POLICY member_portal_insert ON gymos.member_portal_access FOR INSERT TO gymos_app WITH CHECK(owner_id=current_setting('app.gym_owner',true));
CREATE POLICY member_portal_update ON gymos.member_portal_access FOR UPDATE TO gymos_app USING (
 owner_id=current_setting('app.gym_owner',true) OR (user_id IS NULL AND invite_hash=current_setting('app.member_invite',true) AND NOT revoked AND expires_at>now())
) WITH CHECK(owner_id=current_setting('app.gym_owner',true) OR (user_id=current_setting('app.actor',true) AND invite_hash IS NULL AND NOT revoked));
CREATE TABLE gymos.member_faces (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id) ON DELETE CASCADE,
 member_id text NOT NULL, branch text NOT NULL, model text NOT NULL,
 embedding jsonb NOT NULL CHECK(jsonb_typeof(embedding)='array'), consented_at timestamptz NOT NULL,
 PRIMARY KEY(owner_id,member_id)
);
ALTER TABLE gymos.member_faces ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_faces FORCE ROW LEVEL SECURITY;
CREATE POLICY member_faces_scope ON gymos.member_faces TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true));
CREATE TABLE gymos.whatsapp_connections (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id) ON DELETE CASCADE, branch text NOT NULL,
 phone_id text NOT NULL, token_cipher text NOT NULL, api_version text NOT NULL,
 updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(owner_id,branch)
);
CREATE TABLE gymos.whatsapp_rules (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id) ON DELETE CASCADE,
 id text NOT NULL, branch text NOT NULL, payload jsonb NOT NULL, PRIMARY KEY(owner_id,id)
);
CREATE TABLE gymos.whatsapp_outbox (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id) ON DELETE CASCADE,
 id text NOT NULL, branch text NOT NULL, member_id text NOT NULL, rule_id text NOT NULL,
 occurrence text NOT NULL, status text NOT NULL CHECK(status IN ('pending','sending','sent','failed','unknown','cancelled')),
 payload jsonb NOT NULL, provider_id text, error text, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(owner_id,id), UNIQUE(owner_id,rule_id,member_id,occurrence)
);
CREATE INDEX whatsapp_pending ON gymos.whatsapp_outbox(owner_id,status,updated_at);
ALTER TABLE gymos.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.whatsapp_connections FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.whatsapp_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.whatsapp_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.whatsapp_outbox FORCE ROW LEVEL SECURITY;
CREATE POLICY whatsapp_connection_scope ON gymos.whatsapp_connections TO gymos_app USING(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1') WITH CHECK(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1');
CREATE POLICY whatsapp_rule_scope ON gymos.whatsapp_rules TO gymos_app USING(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1') WITH CHECK(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1');
CREATE POLICY whatsapp_outbox_scope ON gymos.whatsapp_outbox TO gymos_app USING(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1') WITH CHECK(owner_id=current_setting('app.gym_owner',true) OR current_setting('app.messaging_worker',true)='1');
REVOKE ALL ON gymos.member_portal_access,gymos.member_faces,gymos.whatsapp_connections,gymos.whatsapp_rules,gymos.whatsapp_outbox FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON gymos.member_portal_access TO gymos_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON gymos.member_faces,gymos.whatsapp_connections,gymos.whatsapp_rules,gymos.whatsapp_outbox TO gymos_app;
