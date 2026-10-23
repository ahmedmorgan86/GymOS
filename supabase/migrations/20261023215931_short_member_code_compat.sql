-- Deploy this compatibility step before the application starts generating short codes.
CREATE OR REPLACE FUNCTION gymos.member_code_encrypt(value text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,gymos,extensions AS $$
BEGIN
 IF value IS NULL OR NOT (value ~ '^GM-[A-F0-9]{32}$' OR (value ~ '^[A-HJ-NP-Z2-9]{6}$' AND value ~ '[A-Z]' AND value ~ '[2-9]')) THEN RAISE EXCEPTION 'invalid';END IF;
 RETURN encode(extensions.pgp_sym_encrypt(value,gymos._member_code_key(),'cipher-algo=aes256,compress-algo=0'),'base64');
END $$;
REVOKE ALL ON FUNCTION gymos.member_code_encrypt(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.member_code_encrypt(text) TO gymos_app;
