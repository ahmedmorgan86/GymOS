import {test} from 'node:test';
import assert from 'node:assert/strict';
import {platformOwnerClub} from '../app/lib/platform-owner-access.ts';
import {PLATFORM_OWNER_ACCOUNT_ID} from '../app/lib/platform-owner-license.ts';
const target={id:'club-a',storage_key:'tenant:club-a',name:'Existing club'};
test('Cross-club access requires both the fixed owner identity and live platform authority',async()=>{
 const client={query(){throw Error('Must not read another tenant');}};
 for(const [platform,actor] of [[false,PLATFORM_OWNER_ACCOUNT_ID],[true,'different-admin'],[false,'ordinary-user']])assert.equal(await platformOwnerClub(client,platform,actor,target.id),null);
 assert.equal(await platformOwnerClub(client,true,PLATFORM_OWNER_ACCOUNT_ID),null);
});
test('Verified platform owner opens existing and future clubs without membership changes',async()=>{
 const calls=[];const client={async query(sql,args){calls.push({sql,args});return {rows:sql.startsWith('SELECT id')?[target]:[]};}};
 for(const id of ['club-a','future-club','tenant:club-a'])assert.deepEqual(await platformOwnerClub(client,true,PLATFORM_OWNER_ACCOUNT_ID,id),{...target,role:'owner',branches:null});
 assert.equal(calls.length,6);assert.ok(calls.every(x=>x.sql.startsWith('SELECT ')));assert.equal(calls[1].args[0],target.id);
 assert.equal(await platformOwnerClub({async query(){return{rows:[]};}},true,PLATFORM_OWNER_ACCOUNT_ID,'missing'),null);
});
