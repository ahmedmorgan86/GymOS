import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {licenseGrant,licenseState,trialClosed} from '../app/lib/licensing.ts';
test('Trial lasts exactly 30 days and closes at the boundary; paid licenses are unaffected',()=>{
 const now='2026-10-20T18:00:00.000Z';const pending={mode:'monthly',status:'pending',starts_at:null,ends_at:null,maintenance_until:null};const grant=licenseGrant(pending,'trial',now);assert.equal(grant.ends_at,'2026-11-19T18:00:00.000Z');const license={...pending,...grant,status:'active'};
 assert.equal(trialClosed(license,Date.parse(grant.ends_at)-1),false);assert.equal(trialClosed(license,Date.parse(grant.ends_at)),true);assert.equal(licenseState(license,Date.parse(grant.ends_at)).writable,false);assert.equal(trialClosed({...license,mode:'monthly'},Date.parse(grant.ends_at)),false);
});
test('Public trial: owner-only, once across clubs, exact server duration, immutable claim',{skip:process.env.GYMOS_DB_TESTS!=='1'},async()=>{
 const {commercialWork}=await import('../app/lib/commercial.ts');const {getPool}=await import('../app/lib/database.ts');const pool=getPool(),c=await pool.connect();const user={userId:randomUUID(),displayName:'Synthetic trial',email:'trial@example.invalid'};
 async function reject(fn,code){await c.query('SAVEPOINT denied');await assert.rejects(fn,e=>!code||e.code===code);await c.query('ROLLBACK TO SAVEPOINT denied');}
 try{await c.query('BEGIN');await c.query("SELECT set_config('app.actor',$1,true),set_config('app.platform','',true)",[user.userId]);const first=await commercialWork(c,false,user,{action:'create',name:'ROLLBACK trial'});const trial=await commercialWork(c,false,user,{action:'trial.start',tenant:first.id});assert.equal(Date.parse(trial.endsAt)-Date.parse(trial.startsAt),30*86400000);
 await reject(()=>commercialWork(c,false,user,{action:'trial.start',tenant:first.id}),'trialUsed');const second=await commercialWork(c,false,user,{action:'create',name:'ROLLBACK second trial'});await reject(()=>commercialWork(c,false,user,{action:'trial.start',tenant:second.id}),'trialUsed');
 await reject(()=>c.query('DELETE FROM gymos.trial_claims WHERE owner_id=$1',[user.userId]),'42501');await c.query("SELECT set_config('app.actor',$1,true)",[randomUUID()]);await reject(()=>c.query('SELECT gymos.start_public_trial($1)',[first.id]),'42501');assert.equal((await c.query('SELECT owner_id FROM gymos.trial_claims')).rowCount,0);
 }finally{await c.query('ROLLBACK');c.release();await pool.end();}
});
