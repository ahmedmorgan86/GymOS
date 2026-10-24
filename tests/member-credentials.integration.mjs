import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '../app/api/member-code/route.ts';
const origin='https://gym.example';
function setup(){
 globalThis.__credentialContext={role:'owner',owner:'club-a',tenantId:'tenant-a',branches:null,license:null,user:{userId:'owner-a'}};
 globalThis.__credentialSpace={state:{members:[{id:'member-a',phone:'+12025550199',branch:'main',archived:false,demo:false}]}};
 const calls=[],account={pin:'123456',pin_must_change:true,revoked:false};
 globalThis.__credentialClient={async query(sql,values=[]){calls.push({sql,values});if(sql.startsWith('UPDATE gymos.member_code_access SET pin_hash')){account.pin=values[0];account.revoked=false;}if(sql.startsWith('SELECT CASE'))return{rows:[account]};return{rows:[]};}};
 return{calls,account};
}
function request(action){return new Request(origin+'/api/member-code',{method:'POST',headers:{origin,'Content-Type':'application/json','X-GymOS-Tenant':'tenant-a'},body:JSON.stringify({member:'member-a',action})});}
test('Reading legacy credentials never reveals the shared PIN and requests explicit activation',async()=>{const qa=setup();const r=await POST(request('read'));assert.equal(r.status,200);const data=await r.json();assert.equal(data.pin,null);assert.equal(data.needsActivation,true);assert.equal(qa.calls.filter(c=>c.sql.startsWith('UPDATE')).length,0);});
test('Staff-issued temporary PIN is random, revokes old sessions and audits without recording the credential',async()=>{const qa=setup();const r=await POST(request('rotate'));assert.equal(r.status,200);const data=await r.json();assert.match(data.pin,/^[0-9]{6}$/);assert.notEqual(data.pin,'123456');assert.equal(data.needsActivation,false);assert.equal(globalThis.__credentialOwner,'club-a');assert.ok(qa.calls.some(c=>c.sql.startsWith('DELETE FROM gymos.member_code_sessions')&&c.values[0]==='club-a'&&c.values[1]==='member-a'));const audit=qa.calls.find(c=>c.sql.includes('INSERT INTO gymos.gym_access_events'));assert.ok(audit);assert.equal(audit.values[4],'member.pin.rotate');assert.deepEqual(JSON.parse(audit.values[5]),{branch:'main'});assert.ok(!audit.values.includes(data.pin));});
test('Reception and a manager from another branch cannot issue member credentials',async()=>{for(const ctx of [{role:'reception',branches:['main']},{role:'manager',branches:['other']}]){const qa=setup();Object.assign(globalThis.__credentialContext,ctx);assert.equal((await POST(request('rotate'))).status,403);assert.equal(qa.calls.length,0);}});
