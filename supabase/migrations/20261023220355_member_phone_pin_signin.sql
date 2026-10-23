-- Phone is an identifier, not a secret. A separate private six-digit PIN is required.
ALTER TABLE gymos.member_code_access ADD COLUMN phone_hash text CHECK(phone_hash ~ '^[a-f0-9]{64}$'),ADD COLUMN pin_hash text,ADD COLUMN pin_cipher text;
CREATE INDEX member_phone_lookup ON gymos.member_code_access(phone_hash) WHERE phone_hash IS NOT NULL;
CREATE POLICY member_phone_login ON gymos.member_code_access FOR SELECT TO gymos_app USING(phone_hash=current_setting('app.member_phone',true));
CREATE FUNCTION gymos.normalize_member_phone(value text) RETURNS text LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE phone text;
BEGIN
 IF value IS NULL OR length(value)>50 THEN RETURN NULL;END IF;
 phone:=regexp_replace(translate(value,'٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹','01234567890123456789'),'[[:space:]().-]','','g');
 phone:=regexp_replace(phone,'^00','+');
 IF phone ~ '^01[0125][0-9]{8}$' THEN phone:='+20'||substr(phone,2);
 ELSIF phone ~ '^201[0125][0-9]{8}$' THEN phone:='+'||phone;END IF;
 IF phone ~ '^\+[1-9][0-9]{7,14}$' THEN RETURN phone;END IF;RETURN NULL;
END $$;
CREATE FUNCTION gymos.new_member_pin() RETURNS text LANGUAGE plpgsql VOLATILE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE bytes bytea;n integer;
BEGIN LOOP bytes:=sha256(convert_to(gen_random_uuid()::text||gen_random_uuid()::text,'UTF8'));n:=get_byte(bytes,0)*65536+get_byte(bytes,1)*256+get_byte(bytes,2);IF n<16000000 THEN RETURN lpad((n%1000000)::text,6,'0');END IF;END LOOP;END $$;
CREATE FUNCTION gymos.member_pin_encrypt(value text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos,extensions AS $$
BEGIN IF value IS NULL OR value !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'invalid';END IF;RETURN encode(extensions.pgp_sym_encrypt(value,gymos._member_code_key(),'cipher-algo=aes256,compress-algo=0'),'base64');END $$;
CREATE FUNCTION gymos.member_pin_hash(value text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,extensions AS $$
BEGIN IF value IS NULL OR value !~ '^[0-9]{6}$' THEN RAISE EXCEPTION 'invalid';END IF;RETURN extensions.crypt(value,extensions.gen_salt('bf',10));END $$;
CREATE FUNCTION gymos.member_pin_matches(value text,encoded text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,extensions AS $$
DECLARE result text;
BEGIN IF value IS NULL OR value !~ '^[0-9]{6}$' OR (encoded IS NOT NULL AND length(encoded)<>60) THEN RETURN false;END IF;
 result:=extensions.crypt(value,coalesce(encoded,'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'));
 RETURN encoded IS NOT NULL AND result=encoded;
END $$;
REVOKE ALL ON FUNCTION gymos.normalize_member_phone(text),gymos.new_member_pin(),gymos.member_pin_encrypt(text),gymos.member_pin_hash(text),gymos.member_pin_matches(text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.normalize_member_phone(text),gymos.new_member_pin(),gymos.member_pin_encrypt(text),gymos.member_pin_hash(text),gymos.member_pin_matches(text,text) TO gymos_app;
ALTER FUNCTION gymos.sync_member_codes(jsonb) RENAME TO sync_member_code_accounts;
CREATE FUNCTION gymos.sync_member_codes(members jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos AS $$
DECLARE own text:=current_setting('app.gym_owner',true);m jsonb;phone text;phone_digest text;pin text;old_phone text;old_pin text;
BEGIN
 PERFORM gymos.sync_member_code_accounts(members);
 FOR m IN SELECT e FROM jsonb_array_elements(members) e WHERE NOT coalesce((e->>'demo')::boolean,false) AND NOT coalesce((e->>'archived')::boolean,false) LOOP
  phone:=gymos.normalize_member_phone(m->>'phone');phone_digest:=CASE WHEN phone IS NULL THEN NULL ELSE encode(sha256(convert_to(phone,'UTF8')),'hex') END;
  SELECT phone_hash,pin_hash INTO old_phone,old_pin FROM gymos.member_code_access WHERE owner_id=own AND member_id=m->>'id' FOR UPDATE;
  IF phone_digest IS DISTINCT FROM old_phone OR (phone_digest IS NOT NULL AND old_pin IS NULL) THEN
   IF phone_digest IS NULL THEN UPDATE gymos.member_code_access SET phone_hash=NULL,pin_hash=NULL,pin_cipher=NULL,version=version+1 WHERE owner_id=own AND member_id=m->>'id';
   ELSE pin:=gymos.new_member_pin();UPDATE gymos.member_code_access SET phone_hash=phone_digest,pin_hash=gymos.member_pin_hash(pin),pin_cipher=gymos.member_pin_encrypt(pin),version=version+1 WHERE owner_id=own AND member_id=m->>'id';END IF;
  END IF;
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION gymos.sync_member_codes(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.sync_member_codes(jsonb) TO gymos_app;
DO $$ DECLARE s record;members jsonb;BEGIN
 FOR s IN SELECT user_id,payload::jsonb AS payload FROM gymos.gym_states LOOP
  PERFORM set_config('app.gym_owner',s.user_id,true);
  IF s.payload->>'_entityStorage'='1' THEN SELECT coalesce(jsonb_agg(e.payload),'[]'::jsonb) INTO members FROM gymos.gym_entities e WHERE e.owner_id=s.user_id AND e.collection='members';ELSE members:=coalesce(s.payload->'members','[]'::jsonb);END IF;
  PERFORM gymos.sync_member_codes(members);
 END LOOP;
END $$;
