import {test} from 'node:test';import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {assertFreshDatabase} from '../scripts/migration-preflight.mjs';
test('Base bootstrap allows a fresh database and refuses existing workspaces/commercial schemas without altering policies',async()=>{
 const db=new PGlite();try{
  await assertFreshDatabase(db);
  await db.exec("CREATE SCHEMA gymos;CREATE TABLE gymos.gym_states(id text);ALTER TABLE gymos.gym_states ENABLE ROW LEVEL SECURITY;CREATE POLICY tenant_guard ON gymos.gym_states USING(id=current_setting('app.gym_owner',true));");
  const before=await db.query("SELECT qual FROM pg_policies WHERE policyname='tenant_guard'");
  await assert.rejects(()=>assertFreshDatabase(db),/Refusing base bootstrap/);
  assert.deepEqual((await db.query("SELECT qual FROM pg_policies WHERE policyname='tenant_guard'")).rows,before.rows);
  await db.exec('DROP TABLE gymos.gym_states;CREATE TABLE gymos.tenants(id text)');
  await assert.rejects(()=>assertFreshDatabase(db),/Refusing base bootstrap/);
 }finally{await db.close();}
});
