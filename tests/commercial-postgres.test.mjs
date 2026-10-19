import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
test('Commercial PostgreSQL: tenant isolation, quote, transfer, approval, duplicate protection and RLS',{skip:process.env.GYMOS_DB_TESTS!=='1'},async()=>{
 const {commercialWork,commercialTransaction}=await import('../app/lib/commercial.ts');const {claimAccessStatement}=await import('../app/lib/team-claim.ts');const {getPool}=await import('../app/lib/database.ts');const pool=getPool(),client=await pool.connect();
 const user=id=>({userId:id,displayName:'Synthetic commercial test',email:'test@example.invalid',fullName:null});
 const a=user(randomUUID()),b=user(randomUUID()),admin=user(process.env.GYMOS_TEST_ADMIN_ID);assert.ok(admin.userId,'Explicit test administrator required');
 async function as(who){await client.query("SELECT set_config('app.actor',$1,true),set_config('app.platform','',true),set_config('app.tenant','',true),set_config('app.gym_owner','',true)",[who.userId]);const isAdmin=(await client.query('SELECT user_id FROM gymos.platform_admins WHERE user_id=$1',[who.userId])).rowCount===1;if(isAdmin)await client.query("SELECT set_config('app.platform','1',true)");return isAdmin;}
 async function call(who,body){return commercialWork(client,await as(who),who,body);}
 async function rejected(work,code){await client.query('SAVEPOINT expected_failure');await assert.rejects(work,error=>!code||error.code===code);await client.query('ROLLBACK TO SAVEPOINT expected_failure');}
 try{await client.query('BEGIN');const ca=await call(a,{action:'create',name:'ROLLBACK TEST A'}),cb=await call(b,{action:'create',name:'ROLLBACK TEST B'});assert.ok(ca.id&&cb.id&&ca.id!==cb.id);
  await rejected(()=>call(a,{action:'select',tenant:cb.id}),'forbidden');
  await as(a);await client.query("SELECT set_config('app.tenant',$1,true)",[ca.id]);assert.equal((await client.query('SELECT id FROM gymos.tenants WHERE id=$1',[cb.id])).rowCount,0);assert.equal((await client.query("UPDATE gymos.tenant_licenses SET status='active' WHERE tenant_id=$1",[ca.id])).rowCount,0);
  await rejected(()=>call(a,{action:'settings',company:'Unauthorized'}),'forbidden');
  await call(a,{action:'order',tenant:ca.id,plan:'custom',mode:'monthly'});
  await rejected(()=>call(a,{action:'order',tenant:ca.id,plan:'custom',mode:'monthly'}),'23505');
  await as(admin);const order=(await client.query('SELECT * FROM gymos.activation_requests WHERE tenant_id=$1',[ca.id])).rows[0];assert.equal(order.status,'quote_requested');
  await call(admin,{action:'quote',id:order.id,amount:10000,note:'Synthetic quotation'});
  await call(a,{action:'transfer',tenant:ca.id,id:order.id,reference:'SYNTHETIC-NOT-A-REAL-TRANSFER',day:new Date().toISOString().slice(0,10),amount:10000});
  await rejected(()=>call(admin,{action:'approve',id:order.id,note:'Synthetic approval'}),'paymentMismatch');
  await call(admin,{action:'approve',id:order.id,note:'Synthetic verified transfer',confirm:'VERIFIED_TRANSFER'});
  await rejected(()=>call(admin,{action:'approve',id:order.id,note:'Duplicate',confirm:'VERIFIED_TRANSFER'}),'conflict');
  await rejected(()=>call(admin,{action:'select',tenant:ca.id}),'forbidden');
  await call(b,{action:'order',tenant:cb.id,plan:'custom',mode:'monthly'});await as(admin);const second=(await client.query('SELECT id FROM gymos.activation_requests WHERE tenant_id=$1',[cb.id])).rows[0];
  await call(admin,{action:'quote',id:second.id,amount:10000,note:'Second synthetic quotation'});
  await call(b,{action:'transfer',tenant:cb.id,id:second.id,reference:'synthetic-not-a-real-transfer',day:new Date().toISOString().slice(0,10),amount:10000});
  await rejected(()=>call(admin,{action:'approve',id:second.id,note:'Reused transfer',confirm:'VERIFIED_TRANSFER'}),'paymentAlreadyUsed');
  await as(admin);const license=(await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1',[ca.id])).rows[0];assert.equal(license.status,'active');assert.equal(license.mode,'monthly');assert.equal(license.revision,1);
  assert.ok((await client.query('SELECT count(*)::int AS n FROM gymos.commercial_audit WHERE tenant_id=$1',[ca.id])).rows[0].n>=5);
  await client.query('UPDATE gymos.tenant_licenses SET starts_at=transaction_timestamp(),limits=jsonb_set(limits,\'{staff}\',\'1\') WHERE tenant_id=$1',[ca.id]);
  await as(a);const key=(await call(a,{action:'select',tenant:ca.id})).id;assert.equal(key,ca.id);const storage=(await client.query('SELECT storage_key FROM gymos.tenants WHERE id=$1',[ca.id])).rows[0].storage_key;
  await client.query("SELECT set_config('app.gym_owner',$1,true)",[storage]);
  const addStaff=who=>client.query("INSERT INTO gymos.gym_access(owner_id,user_id,name,role,branches,revoked) VALUES($1,$2,'Synthetic staff','manager','[\"main\"]',0)",[storage,who.userId]);
  const token=randomUUID();await client.query("INSERT INTO gymos.gym_invites(token_hash,owner_id,role,branches,expires_at) VALUES($1,$2,'manager','[\"main\"]',$3)",[token,storage,new Date(Date.now()+60000).toISOString()]);await claimAccessStatement(b,token,true).execute(client);
  const c=user(randomUUID());await rejected(()=>addStaff(c),'42501');
  await call(a,{action:'owner.add',tenant:ca.id,user:b.userId,confirm:'CHANGE_OWNERSHIP'});
  if(process.env.GYMOS_PARTITION_RLS_TESTS==='1'){
   await as(a);assert.equal((await client.query('SELECT user_id FROM gymos.gym_states')).rowCount,0);await client.query("SELECT set_config('app.gym_owner',$1,true)",[storage]);assert.equal((await client.query('SELECT user_id FROM gymos.gym_states')).rowCount,1);await addStaff(c);
   await as(admin);await client.query("UPDATE gymos.tenant_licenses SET status='suspended' WHERE tenant_id=$1",[ca.id]);await as(a);await client.query("SELECT set_config('app.gym_owner',$1,true)",[storage]);await client.query('UPDATE gymos.gym_access SET revoked=1 WHERE owner_id=$1 AND user_id=$2',[storage,c.userId]);assert.equal((await client.query('SELECT revoked FROM gymos.tenant_memberships WHERE tenant_id=$1 AND user_id=$2',[ca.id,c.userId])).rows[0].revoked,true);await as(admin);await client.query("UPDATE gymos.tenant_licenses SET status='active' WHERE tenant_id=$1",[ca.id]);await as(a);await client.query("SELECT set_config('app.gym_owner',$1,true)",[storage]);
  }
  await rejected(()=>client.query('UPDATE gymos.gym_access SET revoked=1 WHERE owner_id=$1 AND user_id=$2',[storage,b.userId]),'42501');
  await call(b,{action:'owner.remove',tenant:ca.id,user:a.userId,confirm:'CHANGE_OWNERSHIP'});
  await rejected(()=>call(a,{action:'select',tenant:ca.id}),'forbidden');
  await rejected(()=>call(b,{action:'owner.remove',tenant:ca.id,user:b.userId,confirm:'CHANGE_OWNERSHIP'}),'lastOwner');
  await as(a);await rejected(()=>client.query('INSERT INTO gymos.platform_admins(user_id) VALUES($1)',[a.userId]),'42501');await rejected(()=>client.query('DELETE FROM gymos.commercial_audit WHERE actor=$1',[a.userId]),'42501');
 }finally{await client.query('ROLLBACK');client.release();}
 try{const authority=await commercialTransaction(a,async(_client,platform)=>platform);assert.equal(authority,false);}finally{await pool.end();}
});
