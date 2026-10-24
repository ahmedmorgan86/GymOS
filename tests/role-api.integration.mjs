import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';import {POST,GET} from '../app/api/workspace/route.ts';import {GET as presence} from '../app/api/presence/route.ts';import {packet} from '../app/lib/workspace-packet.ts';import {emptyState,applyOperation} from '../app/lib/domain.ts';
function setup(role,branches=null){let state=emptyState();state.branches.push({id:'other',name:'Secret branch'});state=applyOperation(state,{type:'member.save',branch:'other',name:'Secret member',phone:'',joined:'2026-01-01',expires:'2027-01-01'},'2026-10-23T12:00:00Z','owner',randomUUID);state.members[0].health={height:180,consentedAt:'2026-10-23T12:00:00Z'};globalThis.__qaSpace={state,revision:0};globalThis.__qaContext=role?{role,branches,owner:'qa-owner',tenantId:'qa-tenant',license:null,user:{userId:'qa-user',displayName:'QA staff',email:'test@example.invalid'}}:null;}
function request(operation,overrides={}){return new Request('https://gym.example/api/workspace',{method:'POST',headers:{origin:'https://gym.example','Content-Type':'application/json','X-GymOS-Tenant':'qa-tenant'},body:JSON.stringify({revision:globalThis.__qaSpace.revision,requestId:randomUUID(),operation,...overrides})});}
const save={type:'member.save',branch:'main',name:'Test member',phone:'',joined:'2026-01-01',expires:'2027-01-01'};

test('Sensitive feature APIs reject anonymous users, reception and foreign branch managers before database access',async()=>{
 const {POST:face}=await import('../app/api/face/route.ts'),{POST:invite}=await import('../app/api/member-access/route.ts'),{POST:memberCode}=await import('../app/api/member-code/route.ts'),{GET:waGet,POST:waPost}=await import('../app/api/whatsapp/route.ts'),{GET:report}=await import('../app/api/reports/export/route.ts');
 for(const role of [null,'reception']){setup(role,['main']);for(const handler of [face,invite,waPost,memberCode])assert.equal((await handler(request({}))).status,403);assert.equal((await waGet(new Request('https://gym.example/api/whatsapp?branch=main'))).status,403);assert.equal((await report(new Request('https://gym.example/api/reports/export'))).status,403);}
 setup('manager',['main']);const foreign=globalThis.__qaSpace.state.members[0].id;
 const bodyRequest=(body,url='https://gym.example/api/face')=>new Request(url,{method:'POST',headers:{origin:'https://gym.example','Content-Type':'application/json','X-GymOS-Tenant':'qa-tenant'},body:JSON.stringify(body)});
 assert.equal((await face(bodyRequest({action:'identify',branch:'other'}))).status,403);
 assert.equal((await invite(bodyRequest({member:foreign,email:'qa@example.invalid'}))).status,403);
 assert.equal((await waGet(new Request('https://gym.example/api/whatsapp?branch=other'))).status,403);
 const reportURL='https://gym.example/api/reports/export?owner=qa-tenant&from=2026-10-01&to=2026-10-31&branch=';
 assert.equal((await report(new Request(reportURL+'other'))).status,403);
 assert.equal((await report(new Request(reportURL+'main&health=1'))).status,403);
 for(const role of ['owner','manager']){setup(role);globalThis.__qaContext.license={mode:'monthly',status:'suspended',starts_at:'2026-01-01T00:00:00Z',ends_at:'2027-01-01T00:00:00Z',maintenance_until:null};for(const handler of [face,invite,memberCode])assert.equal((await handler(bodyRequest({branch:'main'}))).status,403);assert.equal((await waPost(bodyRequest({action:'run'},'https://gym.example/api/whatsapp?branch=main'))).status,403);}
});
test('Owner and full administrator can create members and manage global settings',async()=>{for(const role of ['owner','manager']){setup(role,role==='owner'?null:['main','other']);let r=await POST(request(save));assert.equal(r.status,200);assert.equal(globalThis.__qaSpace.state.members.length,2);r=await POST(request({type:'branch.add',branch:'main',name:'New branch'}));assert.equal(r.status,200);}});
test('Branch manager may edit assigned branch, cannot edit another or global settings',async()=>{setup('manager',['main']);assert.equal((await POST(request(save))).status,200);assert.equal((await POST(request({...save,branch:'other'}))).status,403);assert.equal((await POST(request({type:'branch.add',branch:'main',name:'Not allowed'}))).status,403);const r=await GET(new Request('https://gym.example/api/workspace'));const d=await r.json();assert.ok(!JSON.stringify(d).includes('Secret member'));assert.ok(!JSON.stringify(d).includes('Secret branch'));});
test('Reception without delegation cannot mutate attendance, prices, people, shifts or permissions',async()=>{setup('reception',['main']);for(const type of ['member.save','visit.scan','shift.save','coach.payout','shop.product.save','legacy.import','member.whatsapp.consent'])assert.equal((await POST(request({...save,type}))).status,403);const d=packet(globalThis.__qaSpace,globalThis.__qaContext);assert.equal(d.state.payments.length,0);assert.equal(d.state.coaches.length,0);assert.ok(!JSON.stringify(d).includes('Secret member'));});
test('Anonymous, cross-origin, stale revisions, wrong tenants and duplicate request IDs are guarded',async()=>{setup(null);assert.equal((await POST(request(save))).status,401);setup('owner');const wrongOrigin=new Request(request(save),{headers:{origin:'https://evil.example','Content-Type':'application/json'}});assert.equal((await POST(wrongOrigin)).status,403);assert.equal((await POST(request(save,{revision:99}))).status,409);const id=randomUUID();assert.equal((await POST(request(save,{requestId:id,revision:0}))).status,200);assert.equal((await POST(request(save,{requestId:id,revision:0}))).status,200);assert.equal(globalThis.__qaSpace.state.members.length,2);setup('owner');globalThis.__qaContext.license={mode:'perpetual',status:'active',starts_at:'2026-01-01T00:00:00Z',ends_at:null,maintenance_until:null};const wrongTenant=new Request(request(save),{headers:{origin:'https://gym.example','Content-Type':'application/json','X-GymOS-Tenant':'foreign'}});assert.equal((await POST(wrongTenant)).status,409);setup('manager',['main']);assert.equal((await presence(new Request('https://gym.example/api/presence?branch=other'))).status,403);});

test('Owner delegates attendance by branch; reception cannot escalate, alter prices or use revoked grants',async()=>{
 setup('owner');assert.equal((await POST(request(save))).status,200);const member=globalThis.__qaSpace.state.members.find(m=>m.branch==='main').id;
 assert.equal((await POST(request({type:'access.attendance',branch:'main',user:'qa-user',enabled:true}))).status,200);
 globalThis.__qaContext.role='reception';globalThis.__qaContext.branches=['main'];
 const p=packet(globalThis.__qaSpace,globalThis.__qaContext);assert.deepEqual(p.attendanceBranches,['main']);assert.equal(p.state.attendanceGrants,undefined);
 assert.equal((await POST(request({type:'visit.add',branch:'main',id:member}))).status,200);
 assert.equal((await POST(request({type:'visit.exit',branch:'main',id:globalThis.__qaSpace.state.visits[0].id}))).status,200);
 for(const type of ['access.attendance','plan.save','payment.add','member.save','visit.offline'])assert.equal((await POST(request({type,branch:'main',user:'qa-user',enabled:true}))).status,403);
 assert.equal((await POST(request({type:'visit.add',branch:'other',id:member}))).status,403);
 globalThis.__qaContext.role='owner';assert.equal((await POST(request({type:'access.attendance',branch:'main',user:'qa-user',enabled:false}))).status,200);
 globalThis.__qaContext.role='reception';assert.equal((await POST(request({type:'visit.add',branch:'main',id:member}))).status,403);
 globalThis.__qaContext.role='manager';assert.equal((await POST(request({type:'access.attendance',branch:'main',user:'qa-user',enabled:true}))).status,403);
});
test('Concurrent check-ins from one revision commit at most once and retry is idempotent',async()=>{
 setup('owner');await POST(request(save));const member=globalThis.__qaSpace.state.members.find(m=>m.branch==='main').id;
 const id=randomUUID(),revision=globalThis.__qaSpace.revision,operation={type:'visit.add',branch:'main',id:member};
 const responses=await Promise.all([POST(request(operation,{requestId:id,revision})),POST(request(operation,{requestId:randomUUID(),revision}))]);
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal(globalThis.__qaSpace.state.visits.length,1);
 assert.equal((await POST(request(operation,{requestId:id,revision}))).status,200);assert.equal(globalThis.__qaSpace.state.visits.length,1);
});

test('Full-admin backup restore cannot grant reception new rights or resurrect revoked grants',async()=>{
 const {POST:restore}=await import('../app/api/backup/route.ts');const {createHash}=await import('node:crypto');
 setup('manager',['main','other']);const state=structuredClone(globalThis.__qaSpace.state);state.attendanceGrants=[{user:'attacker',branch:'main'}];state.bookingGrants=[{user:'attacker',branch:'main'}];state.salesGrants=[{user:'attacker',branch:'main'}];state.collectionGrants=[{user:'attacker',branch:'main'}];
 const backup={format:'gymos-backup',version:2,tenant:'qa-tenant',state,digest:createHash('sha256').update(JSON.stringify(state)).digest('hex')};
 const response=await restore(new Request('https://gym.example/api/backup',{method:'POST',headers:{origin:'https://gym.example','Content-Type':'application/json','X-GymOS-Tenant':'qa-tenant'},body:JSON.stringify({confirm:'RESTORE',revision:0,backup})}));
 assert.equal(response.status,200);assert.deepEqual(globalThis.__qaSpace.state.attendanceGrants,[]);assert.deepEqual(globalThis.__qaSpace.state.bookingGrants,[]);assert.deepEqual(globalThis.__qaSpace.state.salesGrants,[]);assert.deepEqual(globalThis.__qaSpace.state.collectionGrants,[]);
});

test('Reception booking delegation is independent, branch-scoped, revocable and respects capacity',async()=>{
 setup('owner');await POST(request(save));await POST(request({...save,name:'Another member'}));
 const members=globalThis.__qaSpace.state.members.filter(m=>m.branch==='main');
 assert.equal((await POST(request({type:'class.add',branch:'main',title:'QA class',at:new Date(Date.now()+86400000).toISOString(),capacity:1}))).status,200);
 const id=globalThis.__qaSpace.state.classes[0].id;
 assert.equal((await POST(request({type:'access.booking',branch:'main',user:'qa-user',enabled:true}))).status,200);
 globalThis.__qaContext.role='reception';globalThis.__qaContext.branches=['main'];
 const p=packet(globalThis.__qaSpace,globalThis.__qaContext);assert.deepEqual(p.bookingBranches,['main']);assert.deepEqual(p.attendanceBranches,[]);assert.equal(p.state.bookingGrants,undefined);
 assert.equal((await POST(request({type:'visit.add',branch:'main',id:members[0].id}))).status,403);
 assert.equal((await POST(request({type:'class.book',branch:'main',id,member:members[0].id}))).status,200);
 const full=await POST(request({type:'class.book',branch:'main',id,member:members[1].id}));assert.equal(full.status,400);assert.equal((await full.json()).error,'capacity');
 assert.equal((await POST(request({type:'class.book',branch:'main',id,member:members[1].id,wait:true}))).status,200);
 assert.equal((await POST(request({type:'class.book',branch:'main',id,member:members[0].id,cancel:true}))).status,200);
 assert.deepEqual(globalThis.__qaSpace.state.classes[0].members,[members[1].id]);
 for(const type of ['access.booking','class.add','class.cancel','plan.save','payment.add'])assert.equal((await POST(request({type,branch:'main',id}))).status,403);
 assert.equal((await POST(request({type:'class.book',branch:'other',id,member:members[0].id}))).status,403);
 globalThis.__qaContext.role='owner';await POST(request({type:'access.booking',branch:'main',user:'qa-user',enabled:false}));globalThis.__qaContext.role='reception';
 assert.equal((await POST(request({type:'class.book',branch:'main',id,member:members[1].id,cancel:true}))).status,403);
});

test('Delegated reception sales register pending profiles and invoice fixed plans without implicit collection rights',async()=>{
 setup('owner');assert.equal((await POST(request({type:'plan.save',branch:'main',name:'QA membership',days:30,visits:5,minor:10000}))).status,200);
 await POST(request({type:'access.sales',branch:'main',user:'qa-user',enabled:true}));
 globalThis.__qaContext.role='reception';globalThis.__qaContext.branches=['main'];
 assert.equal((await POST(request({...save,type:'member.register',awaitingSubscription:false}))).status,200);
 const m=globalThis.__qaSpace.state.members.find(m=>m.branch==='main');assert.equal(m.awaitingSubscription,true);
 const plan=globalThis.__qaSpace.state.plans[0].id,start=new Intl.DateTimeFormat('en-CA',{timeZone:globalThis.__qaSpace.state.settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const assign={type:'plan.assign',branch:'main',id:m.id,plan,start,due:start,paid:0,method:'cash'};
 assert.equal((await POST(request({...assign,paid:5000}))).status,403);
 assert.equal((await POST(request({...assign,startMode:'replaceCurrent',confirmReplace:true}))).status,403);
 assert.equal((await POST(request({...assign,branch:'other'}))).status,403);
 assert.equal((await POST(request({...assign,minor:1,days:9999}))).status,200);
 assert.equal(globalThis.__qaSpace.state.invoices[0].total,10000);assert.equal(globalThis.__qaSpace.state.payments.length,0);assert.equal(globalThis.__qaSpace.state.members.find(x=>x.id===m.id).membershipPeriods[0].sale.minor,10000);
 const p=packet(globalThis.__qaSpace,globalThis.__qaContext);assert.deepEqual(p.salesBranches,['main']);assert.deepEqual(p.collectionBranches,[]);assert.equal(p.state.plans.length,1);assert.equal(p.state.invoices.length,0);assert.equal(p.state.payments.length,0);assert.equal(p.state.salesGrants,undefined);
 for(const type of ['member.save','plan.save','payment.add','payment.void','access.sales'])assert.equal((await POST(request({...save,type,id:m.id}))).status,403);
 globalThis.__qaContext.role='owner';await POST(request({type:'access.sales',branch:'main',user:'qa-user',enabled:false}));globalThis.__qaContext.role='reception';assert.equal((await POST(request({...save,type:'member.register'}))).status,403);
});
test('Collection grant does not imply sales or financial history and receipts remain idempotent',async()=>{
 setup('owner');await POST(request(save));const m=globalThis.__qaSpace.state.members.find(m=>m.branch==='main');await POST(request({type:'access.collection',branch:'main',user:'qa-user',enabled:true}));globalThis.__qaContext.role='reception';globalThis.__qaContext.branches=['main'];
 assert.equal((await POST(request({type:'plan.assign',branch:'main',id:m.id}))).status,403);assert.equal((await POST(request({...save,type:'member.register'}))).status,403);
 const requestId=randomUUID(),revision=globalThis.__qaSpace.revision,operation={type:'payment.add',branch:'main',id:m.id,minor:5000,method:'cash'};
 assert.equal((await POST(request(operation,{requestId,revision}))).status,200);assert.equal((await POST(request(operation,{requestId,revision}))).status,200);assert.equal(globalThis.__qaSpace.state.payments.length,1);
 const p=packet(globalThis.__qaSpace,globalThis.__qaContext);assert.equal(p.state.payments.length,0);assert.equal(p.state.invoices.length,0);assert.equal(p.state.plans.length,0);assert.equal(p.state.collectionGrants,undefined);assert.deepEqual(p.collectionBranches,['main']);
 assert.equal((await POST(request({...operation,type:'payment.void',id:globalThis.__qaSpace.state.payments[0].id,reason:'Not authorized'}))).status,403);
 globalThis.__qaContext.role='owner';await POST(request({type:'access.collection',branch:'main',user:'qa-user',enabled:false}));globalThis.__qaContext.role='reception';assert.equal((await POST(request(operation))).status,403);
});

test('Both sales and collection grants allow priced enrollment but never current-term replacement or staff escalation',async()=>{
 setup('owner');await POST(request({type:'plan.save',branch:'main',name:'Fixed-price package',days:30,visits:2,minor:10000}));for(const kind of ['sales','collection'])await POST(request({type:'access.'+kind,branch:'main',user:'qa-user',enabled:true}));
 globalThis.__qaContext.role='reception';globalThis.__qaContext.branches=['main'];await POST(request({...save,type:'member.register'}));const m=globalThis.__qaSpace.state.members.find(m=>m.branch==='main'),start=new Intl.DateTimeFormat('en-CA',{timeZone:globalThis.__qaSpace.state.settings.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()),assign={type:'plan.assign',branch:'main',id:m.id,plan:globalThis.__qaSpace.state.plans[0].id,start,due:start,paid:5000,method:'cash'};
 assert.equal((await POST(request(assign))).status,200);assert.equal(globalThis.__qaSpace.state.payments[0].minor,5000);assert.equal(globalThis.__qaSpace.state.invoices[0].total,10000);
 assert.equal((await POST(request({...assign,startMode:'replaceCurrent',confirmReplace:true}))).status,403);assert.equal((await POST(request({...save,type:'member.register',id:m.id,name:'Forbidden edit'}))).status,400);assert.equal(globalThis.__qaSpace.state.members.find(x=>x.id===m.id).name,'Test member');
 globalThis.__qaContext.role='manager';for(const kind of ['sales','collection'])assert.equal((await POST(request({type:'access.'+kind,branch:'main',user:'qa-user',enabled:true}))).status,403);
 globalThis.__qaContext.role='reception';globalThis.__qaContext.license={mode:'perpetual',status:'suspended',starts_at:'2026-01-01T00:00:00Z',ends_at:null,maintenance_until:null};assert.equal((await POST(request(assign))).status,403);
});
