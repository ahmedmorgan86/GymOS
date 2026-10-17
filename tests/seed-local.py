from pathlib import Path
import sqlite3,json,hashlib
# Run only in a disposable local preview checkout after applying local migrations.
for path in Path('.wrangler/state/v3/d1').rglob('*.sqlite'):
 db=sqlite3.connect(path,timeout=10)
 if db.execute("select 1 from sqlite_master where name='gym_states'").fetchone():
  row=db.execute("select payload from gym_states where user_id='local_seedy'").fetchone()
  if not row:raise SystemExit('Sign into loopback preview first.')
  state=json.loads(row[0]);state['settings']['name']='API QA isolated gym';state['members'][0]['expires']='2027-01-01';state['members'][0]['card']='GOS'+'F'*24;state['visits']=[]
  db.execute("insert or replace into gym_states(user_id,payload,revision,updated_at) values(?,?,0,?)",('qa-tenant',json.dumps(state,ensure_ascii=False),'2026-10-17T10:00:00Z'))
  db.execute("insert or replace into gym_invites(token_hash,owner_id,role,branches,expires_at,claimed_by) values(?,?,?,?,?,NULL)",(hashlib.sha256(('a'*64).encode()).hexdigest(),'qa-tenant','reception','["main"]','2099-01-01T00:00:00Z'))
  db.execute("delete from gym_access where owner_id='qa-tenant' and user_id='local_seedy'")
  db.commit();db.close();print('Prepared isolated QA tenant.');break
 db.close()
else:raise SystemExit('Local migrated D1 database not found.')
