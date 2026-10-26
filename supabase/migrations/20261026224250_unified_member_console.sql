-- Review and snapshot all affected spaces before application. No existing record is deleted.
-- Abort on legacy collisions: operators must resolve ownership before migration, never auto-renumber.
DO $$ BEGIN
 IF EXISTS(SELECT payload->>'card' FROM gymos.gym_entities WHERE collection='members' AND nullif(payload->>'card','') IS NOT NULL GROUP BY payload->>'card' HAVING count(*)>1) THEN RAISE EXCEPTION 'Legacy barcode collisions: review before migrating'; END IF;
 IF EXISTS(SELECT 1 FROM gymos.gym_states WHERE coalesce((payload::jsonb->>'_entityStorage')::int,0)<>1 AND jsonb_array_length(coalesce(payload::jsonb->'members','[]'))>0) THEN RAISE EXCEPTION 'Migrate legacy spaces to entity storage with backup first'; END IF;
END $$;
CREATE TABLE gymos.membership_cards(
 code text PRIMARY KEY CHECK(code~'^[A-Z0-9][A-Z0-9._-]{0,63}$'),
 owner_id text NOT NULL,member_id text NOT NULL,branch text NOT NULL,
 status text NOT NULL CHECK(status IN ('reserved','active','lost','replaced','cancelled')),
 payload jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX membership_cards_one_active ON gymos.membership_cards(owner_id,member_id) WHERE status='active';
CREATE INDEX membership_cards_member ON gymos.membership_cards(owner_id,member_id);
ALTER TABLE gymos.membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE gymos.membership_cards FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_cards_runtime ON gymos.membership_cards TO gymos_app USING(owner_id=current_setting('app.gym_owner',true)) WITH CHECK(owner_id=current_setting('app.gym_owner',true));
REVOKE ALL ON gymos.membership_cards FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON gymos.membership_cards TO gymos_app;
INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status,payload)
 SELECT payload->>'card',owner_id,entity_id,branch,'active',jsonb_build_object('legacy',true)
 FROM gymos.gym_entities WHERE collection='members' AND nullif(payload->>'card','') IS NOT NULL;
CREATE FUNCTION gymos.sync_membership_cards() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos AS $$
DECLARE c jsonb; holder gymos.membership_cards%ROWTYPE; records jsonb; active_code text;
BEGIN
 IF NEW.collection<>'members' THEN RETURN NEW; END IF;
 active_code:=nullif(NEW.payload->>'card','');records:=coalesce(NEW.payload->'cards','[]'::jsonb);
 IF active_code IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(records) x WHERE x->>'code'=active_code) THEN records:=records||jsonb_build_array(jsonb_build_object('code',active_code,'status','active','issuedAt',null,'history','[]'::jsonb)); END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(records) x WHERE x->>'status'='active')>1 OR EXISTS(SELECT 1 FROM jsonb_array_elements(records) x WHERE (x->>'status'='active') IS DISTINCT FROM coalesce(x->>'code'=active_code,false)) THEN RAISE EXCEPTION 'Invalid active card projection' USING ERRCODE='23514'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements(records))<>(SELECT count(DISTINCT x->>'code') FROM jsonb_array_elements(records) x) THEN RAISE EXCEPTION 'Duplicate card history' USING ERRCODE='23514'; END IF;
 UPDATE gymos.membership_cards SET status='replaced' WHERE owner_id=NEW.owner_id AND member_id=NEW.entity_id AND status='active' AND code IS DISTINCT FROM active_code;
 FOR c IN SELECT value FROM jsonb_array_elements(records) LOOP
  SELECT * INTO holder FROM gymos.membership_cards WHERE code=c->>'code' FOR UPDATE;
  IF FOUND AND (holder.owner_id<>NEW.owner_id OR holder.member_id<>NEW.entity_id) THEN RAISE EXCEPTION 'Barcode already used' USING ERRCODE='23505'; END IF;
  INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status,payload) VALUES(c->>'code',NEW.owner_id,NEW.entity_id,NEW.branch,c->>'status',c)
   ON CONFLICT(code) DO UPDATE SET status=excluded.status,payload=excluded.payload,branch=excluded.branch WHERE membership_cards.owner_id=excluded.owner_id AND membership_cards.member_id=excluded.member_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Barcode ownership conflict' USING ERRCODE='23505'; END IF;
 END LOOP;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION gymos.sync_membership_cards() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION gymos.sync_membership_cards() TO gymos_app;
CREATE TRIGGER sync_membership_cards AFTER INSERT OR UPDATE OF payload ON gymos.gym_entities FOR EACH ROW EXECUTE FUNCTION gymos.sync_membership_cards();
CREATE INDEX gym_members_name ON gymos.gym_entities(owner_id,lower(payload->>'name')) WHERE collection='members';
CREATE INDEX gym_members_phone ON gymos.gym_entities(owner_id,(payload->>'phone')) WHERE collection='members';
CREATE UNIQUE INDEX gym_visit_one_open ON gymos.gym_entities(owner_id,(payload->>'member')) WHERE collection='visits' AND payload->>'leftAt' IS NULL;
-- Invoker-only worker. The scheduler runs as the migration administrator, never a browser role.
CREATE FUNCTION gymos.close_attendance_sessions() RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,gymos AS $$
DECLARE space record; v record; deadline timestamptz; cutoff integer; n integer:=0; event jsonb; now_at timestamptz:=clock_timestamp(); changed boolean;
BEGIN
 FOR space IN SELECT user_id,payload FROM gymos.gym_states WHERE coalesce((payload::jsonb->>'_entityStorage')::int,0)=1 ORDER BY user_id FOR UPDATE SKIP LOCKED LOOP
  cutoff:=coalesce((space.payload::jsonb#>>'{settings,reception,autoExitMinutes}')::int,120);cutoff:=greatest(1,least(1440,cutoff));changed:=false;
  FOR v IN SELECT * FROM gymos.gym_entities WHERE owner_id=space.user_id AND collection='visits' AND payload->>'leftAt' IS NULL FOR UPDATE LOOP
   deadline:=coalesce(v.payload->>'activeAt',v.payload->>'at')::timestamptz+make_interval(mins=>cutoff);
   IF deadline>now_at THEN CONTINUE; END IF;
   UPDATE gymos.gym_entities SET payload=payload||jsonb_build_object('leftAt',to_char(deadline AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'exitType','automatic') WHERE owner_id=v.owner_id AND collection='visits' AND entity_id=v.entity_id;
   event:=jsonb_build_object('id',gen_random_uuid()::text,'at',to_char(now_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),'kind','visit.autoExit','subject',v.payload->>'member','actor','server scheduler','branch',v.branch,'detail','Administrative automatic exit; not proof of physical departure');
   INSERT INTO gymos.gym_activity_archive(owner_id,event_id,branch,at,payload) VALUES(v.owner_id,event->>'id',v.branch,event->>'at',event);
   n:=n+1;changed:=true;
  END LOOP;
  IF changed THEN UPDATE gymos.gym_states SET revision=revision+1,updated_at=now_at::text WHERE user_id=space.user_id; END IF;
 END LOOP;RETURN n;
END $$;
REVOKE ALL ON FUNCTION gymos.close_attendance_sessions() FROM PUBLIC,anon,authenticated,gymos_app;
-- Install disabled. Enable only after snapshot, migration validation and matching application deployment.
SELECT cron.schedule('gymos-attendance-auto-exit','* * * * *','SELECT gymos.close_attendance_sessions()');
SELECT cron.alter_job(job_id:=jobid,active:=false) FROM cron.job WHERE jobname='gymos-attendance-auto-exit';
