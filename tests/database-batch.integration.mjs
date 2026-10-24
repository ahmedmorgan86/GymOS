import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setImmediate} from 'node:timers/promises';
import {db} from '../app/lib/database.ts';
process.env.DATABASE_URL='postgresql://synthetic@database.invalid/qa';
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return{promise,resolve};};
function setup(){
 const locks=new Map(),events=[],blocked=deferred(),started=new Map();let next=0;
 function acquire(key,id,shared){
  const lock=locks.get(key)??{writer:null,readers:new Set(),queue:[]};locks.set(key,lock);
  const available=()=>shared?lock.writer===null:lock.writer===null&&lock.readers.size===0;
  function take(){if(shared)lock.readers.add(id);else lock.writer=id;}
  if(available()&&!lock.queue.length){take();return Promise.resolve();}
  return new Promise(resolve=>lock.queue.push({shared,take,resolve}));
 }
 function release(key,id){const lock=locks.get(key);if(lock.writer===id)lock.writer=null;lock.readers.delete(id);
  while(lock.queue.length){const first=lock.queue[0];if(lock.writer!==null||(!first.shared&&lock.readers.size))break;lock.queue.shift();first.take();first.resolve();if(!first.shared)break;}
 }
 globalThis.__batchClient=()=>{const id=++next,held=[];
  return{release(){events.push([id,'release']);},async query(sql,values=[]){events.push([id,sql,...values]);
   if(sql.includes('pg_advisory_xact_lock')){const key=values[0]??'legacy-global',shared=sql.includes('lock_shared');await acquire(key,id,shared);held.push(key);}
   if(sql==='SELECT work_a'){started.get('a')?.resolve();await blocked.promise;}
   if(sql==='SELECT work_b')started.get('b')?.resolve();
   if(sql==='SELECT fail')throw Error('synthetic failure');
   if(sql==='COMMIT'||sql==='ROLLBACK')for(const key of held.splice(0).reverse())release(key,id);return{rows:[],rowCount:1};
  }};
 };
 return{events,blocked,started};
}
test('A blocked batch in one club does not hold up another club',async()=>{
 const qa=setup(),aStarted=deferred();qa.started.set('a',aStarted);const a=db.batch([db.prepare('SELECT work_a')],'club-a');await aStarted.promise;const b=db.batch([db.prepare('SELECT work_b')],'club-b');await setImmediate();
 try{assert.ok(qa.events.some(e=>e[1]==='SELECT work_b'),'another club must reach its statement while club-a is blocked');}finally{qa.blocked.resolve();await Promise.all([a,b]);}
 assert.ok(qa.events.some(e=>e[1].includes('pg_advisory_xact_lock')&&e[2]==='club-a'));assert.ok(qa.events.some(e=>e[1].includes('pg_advisory_xact_lock')&&e[2]==='club-b'));
});
test('Batches for the same club stay serialized and use transaction-local scope',async()=>{
 const qa=setup(),started=deferred();qa.started.set('a',started);const a=db.batch([db.prepare('SELECT work_a')],'club-a');await started.promise;const b=db.batch([db.prepare('SELECT work_b')],'club-a');await setImmediate();
 try{assert.equal(qa.events.some(e=>e[1]==='SELECT work_b'),false);}finally{qa.blocked.resolve();await Promise.all([a,b]);}
 assert.equal(qa.events.filter(e=>e[1]==="SELECT set_config('app.gym_owner',$1,true)"&&e[2]==='club-a').length,2);
});
test('Batch failure rolls back before release and does not strand either lock',async()=>{
 const qa=setup();await assert.rejects(db.batch([db.prepare('SELECT fail')],'club-a'),/synthetic failure/);assert.deepEqual(qa.events.slice(-2).map(e=>e[1]),['ROLLBACK','release']);await db.batch([db.prepare('SELECT work_b')],'club-a');assert.ok(qa.events.some(e=>e[1]==='SELECT work_b'));
});
test('An unscoped legacy batch retains the original shared namespace',async()=>{const qa=setup();await db.batch([db.prepare('SELECT work_b')]);assert.ok(qa.events.some(e=>e[1]==='SELECT pg_advisory_xact_lock(724396173)'&&e.length===2));assert.equal(qa.events.some(e=>e[1].includes('set_config')),false);});
test('New scoped batches still coordinate with a legacy global-lock writer during rolling deployment',async()=>{
 const qa=setup(),started=deferred();qa.started.set('a',started);const legacy=db.batch([db.prepare('SELECT work_a')]);await started.promise;const scoped=db.batch([db.prepare('SELECT work_b')],'club-b');await setImmediate();
 try{assert.equal(qa.events.some(e=>e[1]==='SELECT work_b'),false);}finally{qa.blocked.resolve();await Promise.all([legacy,scoped]);}
 assert.ok(qa.events.some(e=>e[1]==='SELECT pg_advisory_xact_lock_shared(724396173)'));assert.ok(qa.events.some(e=>e[1]==='SELECT work_b'));
});
