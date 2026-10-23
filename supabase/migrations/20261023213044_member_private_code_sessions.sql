CREATE TABLE gymos.member_code_access (
 owner_id text NOT NULL REFERENCES gymos.gym_states(user_id),member_id text NOT NULL,branch text NOT NULL,
 code_hash text NOT NULL UNIQUE CHECK(code_hash ~ '^[a-f0-9]{64}$'),code_cipher text NOT NULL,
 version integer NOT NULL DEFAULT 1,revoked boolean NOT NULL DEFAULT false,inactive boolean NOT NULL DEFAULT false,
 PRIMARY KEY(owner_id,member_id)
);
CREATE TABLE gymos.member_code_sessions (
 session_hash text PRIMARY KEY CHECK(session_hash ~ '^[a-f0-9]{64}$'),owner_id text NOT NULL,member_id text NOT NULL,
 version integer NOT NULL,expires_at timestamptz NOT NULL,
 FOREIGN KEY(owner_id,member_id) REFERENCES gymos.member_code_access(owner_id,member_id) ON DELETE CASCADE
);
CREATE INDEX member_code_sessions_member ON gymos.member_code_sessions(owner_id,member_id);
CREATE TABLE gymos.member_code_attempts (bucket text PRIMARY KEY,started_at timestamptz NOT NULL DEFAULT now(),attempts integer NOT NULL DEFAULT 1);
ALTER TABLE gymos.member_code_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_code_access FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_code_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_code_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_code_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.member_code_attempts FORCE ROW LEVEL SECURITY;
CREATE POLICY member_code_owner ON gymos.member_code_access FOR ALL TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true));
CREATE POLICY member_code_login ON gymos.member_code_access FOR SELECT TO gymos_app USING(code_hash=current_setting('app.member_code',true) OR EXISTS(SELECT 1 FROM gymos.member_code_sessions s WHERE s.owner_id=member_code_access.owner_id AND s.member_id=member_code_access.member_id AND s.session_hash=current_setting('app.member_session',true) AND s.expires_at>now()));
CREATE POLICY member_sessions_read ON gymos.member_code_sessions FOR SELECT TO gymos_app USING(owner_id=current_setting('app.gym_owner',true) OR session_hash=current_setting('app.member_session',true));
CREATE POLICY member_sessions_insert ON gymos.member_code_sessions FOR INSERT TO gymos_app WITH CHECK(owner_id=current_setting('app.gym_owner',true));
CREATE POLICY member_sessions_delete ON gymos.member_code_sessions FOR DELETE TO gymos_app USING(owner_id=current_setting('app.gym_owner',true) OR session_hash=current_setting('app.member_session',true));
CREATE POLICY member_attempt_scope ON gymos.member_code_attempts FOR ALL TO gymos_app USING(bucket=current_setting('app.member_attempt',true)) WITH CHECK(bucket=current_setting('app.member_attempt',true));
REVOKE ALL ON gymos.member_code_access,gymos.member_code_sessions,gymos.member_code_attempts FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON gymos.member_code_access,gymos.member_code_sessions,gymos.member_code_attempts TO gymos_app;
-- Encryption keys remain in Vault and cannot be returned to the application role.
CREATE FUNCTION gymos._member_code_key() RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos,extensions AS $$
DECLARE own text:=current_setting('app.gym_owner',true); secret_name text; value text;
BEGIN
 IF own IS NULL OR own='' OR NOT EXISTS(SELECT 1 FROM gymos.gym_states WHERE user_id=own) THEN RAISE EXCEPTION 'forbidden';END IF;
 secret_name:='gymos_member_codes_'||encode(extensions.digest(own,'sha256'),'hex');
 PERFORM pg_advisory_xact_lock(hashtextextended(secret_name,0));
 SELECT decrypted_secret INTO value FROM vault.decrypted_secrets WHERE name=secret_name;
 IF value IS NULL THEN value:=encode(extensions.gen_random_bytes(32),'hex');PERFORM vault.create_secret(value,secret_name,'GYM OS tenant-scoped member access code encryption');END IF;
 RETURN value;
END $$;
CREATE FUNCTION gymos.member_code_encrypt(value text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos,extensions AS $$
BEGIN IF value !~ '^GM-[A-F0-9]{32}$' THEN RAISE EXCEPTION 'invalid';END IF;RETURN encode(extensions.pgp_sym_encrypt(value,gymos._member_code_key(),'cipher-algo=aes256,compress-algo=0'),'base64');END $$;
CREATE FUNCTION gymos.member_code_decrypt(value text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos,extensions AS $$
BEGIN IF length(value)>2000 THEN RAISE EXCEPTION 'invalid';END IF;RETURN extensions.pgp_sym_decrypt(decode(value,'base64'),gymos._member_code_key());END $$;
REVOKE ALL ON FUNCTION gymos._member_code_key() FROM PUBLIC,anon,authenticated,gymos_app;
REVOKE ALL ON FUNCTION gymos.member_code_encrypt(text),gymos.member_code_decrypt(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.member_code_encrypt(text),gymos.member_code_decrypt(text) TO gymos_app;
CREATE FUNCTION gymos.sync_member_codes(members jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos,extensions AS $$
DECLARE own text:=current_setting('app.gym_owner',true);
BEGIN
 IF own IS NULL OR own='' OR jsonb_typeof(members)<>'array' THEN RAISE EXCEPTION 'forbidden';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('member_codes:'||own,0));
 UPDATE gymos.member_code_access a SET inactive=NOT EXISTS(SELECT 1 FROM jsonb_array_elements(members) m WHERE m->>'id'=a.member_id AND NOT coalesce((m->>'demo')::boolean,false) AND NOT coalesce((m->>'archived')::boolean,false)) WHERE a.owner_id=own;
 WITH eligible AS MATERIALIZED(SELECT m->>'id' AS id,m->>'branch' AS branch FROM jsonb_array_elements(members) m WHERE NOT coalesce((m->>'demo')::boolean,false) AND NOT coalesce((m->>'archived')::boolean,false)),
 fresh AS MATERIALIZED(SELECT e.*,'GM-'||upper(encode(extensions.gen_random_bytes(16),'hex')) AS code FROM eligible e WHERE NOT EXISTS(SELECT 1 FROM gymos.member_code_access a WHERE a.owner_id=own AND a.member_id=e.id))
 INSERT INTO gymos.member_code_access(owner_id,member_id,branch,code_hash,code_cipher) SELECT own,id,branch,encode(extensions.digest(code,'sha256'),'hex'),gymos.member_code_encrypt(code) FROM fresh ON CONFLICT(owner_id,member_id) DO NOTHING;
 UPDATE gymos.member_code_access a SET branch=m->>'branch' FROM jsonb_array_elements(members) m WHERE a.owner_id=own AND a.member_id=m->>'id';
END $$;
REVOKE ALL ON FUNCTION gymos.sync_member_codes(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.sync_member_codes(jsonb) TO gymos_app;
-- Backfill existing non-demo members, including workspaces using entity storage.
DO $$ DECLARE s record; members jsonb; BEGIN
 FOR s IN SELECT user_id,payload::jsonb AS payload FROM gymos.gym_states LOOP
  PERFORM set_config('app.gym_owner',s.user_id,true);
  IF s.payload->>'_entityStorage'='1' THEN SELECT coalesce(jsonb_agg(e.payload),'[]'::jsonb) INTO members FROM gymos.gym_entities e WHERE e.owner_id=s.user_id AND e.collection='members';
  ELSE members:=coalesce(s.payload->'members','[]'::jsonb);END IF;
  PERFORM gymos.sync_member_codes(members);
 END LOOP;
END $$;
