-- Built-in crypto avoids granting the runtime role access to extension schemas.
CREATE OR REPLACE FUNCTION gymos.sync_member_codes(members jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos,extensions AS $$
DECLARE own text:=current_setting('app.gym_owner',true);
BEGIN
 IF own IS NULL OR own='' OR jsonb_typeof(members)<>'array' THEN RAISE EXCEPTION 'forbidden';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('member_codes:'||own,0));
 UPDATE gymos.member_code_access a SET inactive=NOT EXISTS(SELECT 1 FROM jsonb_array_elements(members) m WHERE m->>'id'=a.member_id AND NOT coalesce((m->>'demo')::boolean,false) AND NOT coalesce((m->>'archived')::boolean,false)) WHERE a.owner_id=own;
 WITH eligible AS MATERIALIZED(SELECT m->>'id' AS id,m->>'branch' AS branch FROM jsonb_array_elements(members) m WHERE NOT coalesce((m->>'demo')::boolean,false) AND NOT coalesce((m->>'archived')::boolean,false)),
 fresh AS MATERIALIZED(SELECT e.*,'GM-'||upper(substr(encode(sha256(convert_to(gen_random_uuid()::text||gen_random_uuid()::text,'UTF8')),'hex'),1,32)) AS code FROM eligible e WHERE NOT EXISTS(SELECT 1 FROM gymos.member_code_access a WHERE a.owner_id=own AND a.member_id=e.id))
 INSERT INTO gymos.member_code_access(owner_id,member_id,branch,code_hash,code_cipher) SELECT own,id,branch,encode(sha256(convert_to(code,'UTF8')),'hex'),gymos.member_code_encrypt(code) FROM fresh ON CONFLICT(owner_id,member_id) DO NOTHING;
 UPDATE gymos.member_code_access a SET branch=m->>'branch' FROM jsonb_array_elements(members) m WHERE a.owner_id=own AND a.member_id=m->>'id';
END $$;
