import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import {db,getPool,withScope} from '../app/lib/database.ts';
const configured=Boolean(process.env.GYMOS_CI_POSTGRES_URL);
let admin;
before(async()=>{
 if(!configured)return;
 const u=new URL(process.env.GYMOS_CI_POSTGRES_URL);
 assert.equal(u.hostname,'127.0.0.1');assert.equal(u.pathname,'/gymos_ci');
 admin=new pg.Pool({connectionString:u.href,ssl:false,max:4});
 // Fresh disposable service only: existing schema/role causes a hard failure.
 await admin.query("CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE gymos_app LOGIN PASSWORD 'synthetic-ci-only' NOSUPERUSER NOBYPASSRLS; CREATE SCHEMA gymos; GRANT USAGE ON SCHEMA gymos TO gymos_app;");
 await admin.query(await readFile(new URL('../db/entities.sql',import.meta.url),'utf8'));
 await admin.query("INSERT INTO gymos.gym_entities(owner_id,collection,entity_id,branch,payload) VALUES('club-a','members','a','main','{}'),('club-b','members','b','main','{}')");
 u.username='gymos_app';u.password='synthetic-ci-only';process.env.DATABASE_URL=u.href;
});
after(async()=>{if(configured){await getPool().end();await admin?.end();}});
const options={skip:!configured,timeout:15000};
async function lock(client,owner){await client.query('SELECT pg_advisory_xact_lock_shared(724396173)');await client.query('SELECT pg_advisory_xact_lock(724396173,hashtext($1))',[owner]);}
async function holding(owner,work){const c=await admin.connect();try{await c.query('BEGIN');if(owner)await lock(c,owner);else await c.query('SELECT pg_advisory_xact_lock(724396173)');await work(c);}finally{await c.query('ROLLBACK');c.release();}}
test('PostgreSQL: another club progresses while the first club is locked',options,async()=>{
 let blocked;
 await holding('club-a',async()=>{
  blocked=db.batch([db.prepare("SELECT current_setting('app.gym_owner') AS owner")],'club-a');
  const other=await db.batch([db.prepare("SELECT current_setting('app.gym_owner') AS owner")],'club-b');
  assert.equal(other[0].results[0].owner,'club-b');
 });assert.equal((await blocked)[0].results[0].owner,'club-a');
});
test('PostgreSQL: same club and old global writers exclude concurrent scoped writers',options,async()=>{
 for(const owner of ['club-a',undefined]){
  let waiting,finished=false;
  await holding(owner,async()=>{
   waiting=db.batch([db.prepare('SELECT 1')],'club-a').then(result=>{finished=true;return result;});
   // Wait until PostgreSQL itself reports a blocked advisory lock, not a timing guess.
   let blocked=false;
   for(let attempt=0;attempt<100&&!blocked;attempt++){
    blocked=(await admin.query("SELECT EXISTS(SELECT 1 FROM pg_locks WHERE locktype='advisory' AND NOT granted) AS waiting")).rows[0].waiting;
    if(!blocked)await new Promise(resolve=>setTimeout(resolve,10));
   }
   assert.equal(blocked,true);assert.equal(finished,false);
  });await waiting;assert.equal(finished,true);
 }
});
test('PostgreSQL: failed batches release locks and transaction-local scope',options,async()=>{
 await assert.rejects(db.batch([db.prepare('SELECT * FROM gymos.deliberately_missing_ci_table')],'club-a'),error=>error.code==='42P01');
 const c=await admin.connect();try{await c.query('BEGIN');assert.equal((await c.query('SELECT pg_try_advisory_xact_lock(724396173) AS ok')).rows[0].ok,true);assert.equal((await c.query('SELECT pg_try_advisory_xact_lock(724396173,hashtext($1)) AS ok',['club-a'])).rows[0].ok,true);}finally{await c.query('ROLLBACK');c.release();}
 const reused=await getPool().connect();try{const scope=(await reused.query("SELECT current_setting('app.gym_owner',true) AS owner")).rows[0].owner;assert.ok(scope===null||scope==='');}finally{reused.release();}
});
test('PostgreSQL: repository entity RLS rejects cross-club reads, writes and owner reassignment',options,async()=>{
 assert.equal((await db.prepare('SELECT owner_id FROM gymos.gym_entities').all()).results.length,0);
 await withScope('club-a',async c=>{
  assert.deepEqual((await c.query('SELECT owner_id FROM gymos.gym_entities')).rows,[{owner_id:'club-a'}]);
  assert.equal((await c.query("UPDATE gymos.gym_entities SET payload='{}' WHERE owner_id='club-b'")).rowCount,0);
 });
 await assert.rejects(withScope('club-a',c=>c.query("INSERT INTO gymos.gym_entities(owner_id,collection,entity_id,payload) VALUES('club-b','members','forged','{}')")),e=>e.code==='42501');
 await assert.rejects(withScope('club-a',c=>c.query("UPDATE gymos.gym_entities SET owner_id='club-b' WHERE entity_id='a'")),e=>e.code==='42501');
 for(const role of ['anon','authenticated'])assert.equal((await admin.query("SELECT has_table_privilege($1,'gymos.gym_entities','SELECT') AS allowed",[role])).rows[0].allowed,false);
 const flags=(await admin.query("SELECT relrowsecurity,relforcerowsecurity FROM pg_class WHERE oid='gymos.gym_entities'::regclass")).rows[0];assert.deepEqual(flags,{relrowsecurity:true,relforcerowsecurity:true});
});
