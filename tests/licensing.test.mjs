import {test} from 'node:test';
import assert from 'node:assert/strict';
import {licenseState,licenseGrant,plusMonths,assertGrowth,limits,priceMinor,transferDay} from '../app/lib/licensing.ts';
const now='2026-01-31T12:30:00.000Z';
const base={tenant_id:'a',plan_id:'p',mode:'monthly',status:'active',starts_at:'2026-01-01T00:00:00.000Z',ends_at:'2026-02-28T12:30:00.000Z',maintenance_until:null,limits:{branches:2,members:100,staff:5},revision:0};
test('licenses fail closed at exact expiry, pending, suspended, future and invalid dates',()=>{
 assert.equal(licenseState(base,Date.parse(now)).writable,true);
 for(const patch of [{status:'pending'},{status:'suspended'},{starts_at:'2027-01-01'},{starts_at:null},{ends_at:null},{ends_at:'invalid'},{ends_at:now}])assert.equal(licenseState({...base,...patch},Date.parse(now)).writable,false,JSON.stringify(patch));
 assert.equal(licenseState({...base,mode:'perpetual',ends_at:null,maintenance_until:'2025-01-01'},Date.parse(now)).writable,true);
});
test('calendar renewals preserve UTC time, clamp month ends and stack from unexpired term',()=>{
 assert.equal(plusMonths(now,1),'2026-02-28T12:30:00.000Z');assert.equal(plusMonths('2024-02-29T00:00:00.000Z',12),'2025-02-28T00:00:00.000Z');
 assert.equal(licenseGrant(base,'monthly',now).ends_at,'2026-03-28T12:30:00.000Z');
 assert.equal(licenseGrant({...base,ends_at:'2025-01-01'},'monthly',now).ends_at,'2026-02-28T12:30:00.000Z');
 assert.equal(licenseGrant(base,'trial',now).ends_at,'2026-03-02T12:30:00.000Z');
 assert.throws(()=>plusMonths(now,0));assert.throws(()=>plusMonths('bad',1));
});
test('perpetual maintenance renews support without expiring core access',()=>{
 assert.throws(()=>licenseGrant(base,'maintenance',now));const current={...base,mode:'perpetual',ends_at:null,maintenance_until:'2027-01-31T12:30:00.000Z'};
 const grant=licenseGrant(current,'maintenance',now);assert.equal(grant.ends_at,null);assert.equal(grant.maintenance_until,'2028-01-31T12:30:00.000Z');
});
test('quota reductions preserve data but reject growth; numeric prices reject unsafe values',()=>{
 assert.doesNotThrow(()=>assertGrowth(base.limits,{branches:4,members:200},{branches:3,members:199}));assert.doesNotThrow(()=>assertGrowth(base.limits,{branches:4,members:200},{branches:4,members:200}));
 assert.throws(()=>assertGrowth(base.limits,{branches:2,members:100},{branches:3,members:100}),/branchLimit/);assert.throws(()=>assertGrowth(base.limits,{branches:2,members:100},{branches:2,members:101}),/memberLimit/);
 for(const value of [-1,1.5,Infinity,NaN,Number.MAX_SAFE_INTEGER])assert.throws(()=>priceMinor(value));assert.equal(priceMinor('',true),null);assert.equal(priceMinor('1234'),1234);
 assert.throws(()=>limits({branches:0,members:100,staff:1}));
});


test('Paid suspended and scheduled calendar renewals preserve purchased time and do not activate early',()=>{
 const suspended={...base,status:'suspended'};assert.equal(licenseGrant(suspended,'monthly',now).ends_at,'2026-03-28T12:30:00.000Z');assert.equal(licenseGrant(suspended,'monthly',now).starts_at,base.starts_at);
 const scheduled={...base,starts_at:'2026-02-10T00:00:00.000Z',ends_at:'2026-03-10T00:00:00.000Z'};const grant=licenseGrant(scheduled,'monthly',now);assert.equal(grant.starts_at,scheduled.starts_at);assert.equal(grant.ends_at,'2026-04-10T00:00:00.000Z');assert.equal(licenseState({...scheduled,...grant},Date.parse(now)).writable,false);
 assert.equal(licenseGrant({...scheduled,status:'pending'},'monthly',now).starts_at,now);assert.throws(()=>licenseGrant(base,'monthly','invalid'),/date/);
});
test('Transfer reporting rejects impossible dates and uses the club market day across the UTC boundary',()=>{
 const lateUTC='2026-01-31T23:30:00.000Z';assert.equal(transferDay('2026-02-01',lateUTC),'2026-02-01');assert.throws(()=>transferDay('2026-02-02',lateUTC),/date/);
 assert.equal(transferDay('2024-02-29','2024-03-01T12:00:00Z'),'2024-02-29');for(const day of ['2026-02-31','2026-04-31','2026-00-01','2026-13-01','2026-1-01',null,{},'2026-01-01<script>'])assert.throws(()=>transferDay(day,lateUTC),/date/);
});
