import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {GET as member} from '../app/api/member-portal/route.ts';
import {GET as access} from '../app/api/member-access/route.ts';
import {POST as update} from '../app/api/workspace/route.ts';
import {emptyState,applyOperation} from '../app/lib/domain.ts';
function setup(role='owner',branches=null){let s=emptyState();s.branches.push({id:'other',name:'Other branch'});for(const branch of ['main','other'])s=applyOperation(s,{type:'member.save',branch,name:branch+' member',phone:'',joined:'2026-01-01',expires:'2027-01-01'},'2026-10-23T12:00:00Z','QA',randomUUID);globalThis.__qaSpace={state:s,revision:0};globalThis.__qaContext=role?{role,branches,owner:'tenant:qa-tenant',tenantId:'qa-tenant',license:null,user:{userId:'qa-user',displayName:'QA',email:'qa@example.invalid'}}:null;return s.members;}
const request=(id,club='qa-tenant')=>new Request('https://gym.example/api/member-portal?'+new URLSearchParams({member:id,club}));
test('Administrative member view requires verified staff, correct tenant ID and assigned branch',async()=>{
 let members=setup(null);assert.equal((await member(request(members[0].id))).status,401);
 members=setup('reception',['main']);assert.equal((await member(request(members[0].id))).status,403);
 members=setup('manager',['main']);assert.equal((await member(request(members[1].id))).status,403);assert.equal((await access(new Request('https://gym.example/api/member-access?member='+members[1].id))).status,403);
 assert.equal((await member(request(members[0].id,'foreign'))).status,403);assert.equal((await member(request(members[0].id,'tenant:qa-tenant'))).status,403);
 const response=await member(request(members[0].id)),view=await response.json();assert.equal(response.status,200);assert.equal(view.staffPreview,true);assert.equal(view.member.id,members[0].id);assert.ok(!JSON.stringify(view).includes('other member'));
 globalThis.__qaSpace.state.members[0].demo=true;assert.equal((await member(request(members[0].id))).status,403);globalThis.__qaSpace.state.members[0].demo=false;globalThis.__qaSpace.state.members[0].archived=true;assert.equal((await member(request(members[0].id))).status,403);
});
test('Changes in the club workspace appear in member app: card scan, renewal, payment and training',async()=>{
 const [m]=setup();async function write(operation){const r=await update(new Request('https://gym.example/api/workspace',{method:'POST',headers:{origin:'https://gym.example','Content-Type':'application/json','X-GymOS-Tenant':'qa-tenant'},body:JSON.stringify({revision:globalThis.__qaSpace.revision,requestId:randomUUID(),operation:{branch:'main',...operation}})}));assert.equal(r.status,200,await r.text());}
 await write({type:'card.serial',id:m.id,code:'MEMBER-001'});await write({type:'visit.scan',code:'MEMBER-001'});await write({type:'payment.add',id:m.id,minor:90000,method:'cash'});await write({type:'training.assign',member:m.id,program:'preset-strength',start:'2026-01-01',end:null});
 const v=await(await member(request(m.id))).json();assert.equal(v.member.card,'MEMBER-001');assert.equal(v.visits.length,1);assert.equal(v.payments[0].minor,90000);assert.equal(v.programs.length,1);assert.equal(v.assignments[0].member,m.id);assert.ok(!JSON.stringify(v).includes('other member'));
 globalThis.__qaContext.license={mode:'monthly',status:'suspended',starts_at:'2026-01-01T00:00:00Z',ends_at:'2027-01-01T00:00:00Z',maintenance_until:null};assert.equal((await member(request(m.id))).status,403);
});
