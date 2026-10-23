-- Default PIN is intentionally temporary and never unlocks profile data until changed.
ALTER TABLE gymos.member_code_access ADD COLUMN pin_must_change boolean NOT NULL DEFAULT true;
CREATE OR REPLACE FUNCTION gymos.sync_member_codes(members jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos AS $$
DECLARE own text:=current_setting('app.gym_owner',true);m jsonb;phone text;phone_digest text;pin text;old_phone text;old_pin text;
BEGIN
 PERFORM gymos.sync_member_code_accounts(members);
 FOR m IN SELECT e FROM jsonb_array_elements(members) e WHERE NOT coalesce((e->>'demo')::boolean,false) AND NOT coalesce((e->>'archived')::boolean,false) LOOP
  phone:=gymos.normalize_member_phone(m->>'phone');phone_digest:=CASE WHEN phone IS NULL THEN NULL ELSE encode(sha256(convert_to(phone,'UTF8')),'hex') END;
  SELECT phone_hash,pin_hash INTO old_phone,old_pin FROM gymos.member_code_access WHERE owner_id=own AND member_id=m->>'id' FOR UPDATE;
  IF phone_digest IS DISTINCT FROM old_phone OR (phone_digest IS NOT NULL AND old_pin IS NULL) THEN
   IF phone_digest IS NULL THEN UPDATE gymos.member_code_access SET phone_hash=NULL,pin_hash=NULL,pin_cipher=NULL,pin_must_change=true,version=version+1 WHERE owner_id=own AND member_id=m->>'id';
   ELSE pin:='123456';UPDATE gymos.member_code_access SET phone_hash=phone_digest,pin_hash=gymos.member_pin_hash(pin),pin_cipher=gymos.member_pin_encrypt(pin),pin_must_change=true,version=version+1 WHERE owner_id=own AND member_id=m->>'id';END IF;
  END IF;
 END LOOP;
END $$;
DO $$ DECLARE s record;BEGIN
 FOR s IN SELECT user_id FROM gymos.gym_states LOOP
  PERFORM set_config('app.gym_owner',s.user_id,true);
  UPDATE gymos.member_code_access SET pin_hash=gymos.member_pin_hash('123456'),pin_cipher=gymos.member_pin_encrypt('123456'),pin_must_change=true,version=version+1 WHERE owner_id=s.user_id AND pin_hash IS NOT NULL;
 END LOOP;
END $$;
