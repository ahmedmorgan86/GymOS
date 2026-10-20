import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {assembleTransfer,transferSpec,backupDigest,BACKUP_CHUNK_BYTES,decodeChunk} from '../app/lib/backup-transfer.ts';
import {applyOperation,emptyState} from '../app/lib/domain.ts';
test('Database transfer protocol verifies chunks, owner, actor and round-trip',{skip:process.env.GYMOS_DB_TESTS!=='1'},async()=>{
 const {startTransfer,putTransferChunk,transferContent,getTransferChunk,discardTransfer}=await import('../app/lib/backup-transfer.ts');const owner='transfer-test:'+randomUUID(),actor=randomUUID(),bytes=Buffer.from('صوت وبيانات '.repeat(50000));let upload,download;
 try{upload=await startTransfer(owner,actor,'upload',bytes.length,backupDigest(bytes));await assert.rejects(()=>transferContent(owner,actor,upload.id));
 for(let i=upload.parts-1;i>=0;i--)await putTransferChunk(owner,actor,upload.id,i,bytes.subarray(i*upload.chunkBytes,(i+1)*upload.chunkBytes).toString('base64'));
 assert.equal(await transferContent(owner,actor,upload.id),bytes.toString('utf8'));await assert.rejects(()=>transferContent('foreign:'+owner,actor,upload.id));await assert.rejects(()=>transferContent(owner,randomUUID(),upload.id));await assert.rejects(()=>putTransferChunk(owner,actor,upload.id,0,Buffer.alloc(upload.chunkBytes).toString('base64')));
 download=await startTransfer(owner,actor,'download',bytes.length,backupDigest(bytes),bytes);const chunks=[];for(let i=0;i<download.parts;i++)chunks.push(Buffer.from((await getTransferChunk(owner,actor,download.id,i)).data,'base64'));assert.deepEqual(Buffer.concat(chunks),bytes);assert.equal(await transferContent(owner,actor,upload.id),bytes.toString('utf8'));
 }finally{if(upload)await discardTransfer(owner,actor,upload.id);if(download)await discardTransfer(owner,actor,download.id);}
});
test('Chunked backup round-trips Arabic beyond platform request limits and rejects corruption',()=>{
 const bytes=Buffer.from(JSON.stringify({message:'نسخة احتياطية عربية '.repeat(160000)}));assert.ok(bytes.length>4500000);
 const chunks={};for(let i=0;i<Math.ceil(bytes.length/BACKUP_CHUNK_BYTES);i++)chunks[i]=bytes.subarray(i*BACKUP_CHUNK_BYTES,(i+1)*BACKUP_CHUNK_BYTES).toString('base64');
 const row={bytes:bytes.length,digest:backupDigest(bytes),chunks};assert.deepEqual(assembleTransfer(row),bytes);
 assert.throws(()=>assembleTransfer({...row,chunks:{...chunks,0:chunks[1]}}));assert.throws(()=>assembleTransfer({...row,chunks:{...chunks,1:undefined}}));assert.throws(()=>assembleTransfer({...row,digest:'0'.repeat(64)}));
 assert.throws(()=>transferSpec(67108865,row.digest));assert.throws(()=>decodeChunk('!!!!'));assert.throws(()=>decodeChunk('YQ='));
});
test('50,000 historical activity entries no longer prevent subsequent operations',()=>{
 const state=emptyState();state.events=Array.from({length:50001},(_,i)=>({id:'e'+i,at:'2026-10-20T10:00:00Z',kind:'test',subject:'workspace',actor:'Test',branch:'main'}));
 const op={type:'settings.save',branch:'main',name:'Archive test',currency:'EGP',logo:null};
 const first=applyOperation(state,op,'2026-10-20T10:00:00Z','Test',randomUUID);const second=applyOperation(first,op,'2026-10-20T10:01:00Z','Test',randomUUID);assert.equal(second.events.length,2000);assert.equal(state.events.length,50001);
});
test('Archive and transfer RLS isolate actor and tenant and prohibit changing activity',{skip:process.env.GYMOS_DB_TESTS!=='1'},async()=>{
 const {getPool}=await import('../app/lib/database.ts');const c=await getPool().connect();const owner='rollback:'+randomUUID(),actor=randomUUID(),id=randomUUID();
 try{await c.query('BEGIN');await c.query("SELECT set_config('app.gym_owner',$1,true),set_config('app.gym_actor',$2,true)",[owner,actor]);
 await c.query("INSERT INTO gymos.gym_activity_archive VALUES($1,'event','main','2026-10-20T10:00:00Z','{}')",[owner]);
 await c.query("INSERT INTO gymos.gym_backup_transfers(id,owner_id,actor_id,mode,bytes,digest) VALUES($1,$2,$3,'upload',1,$4)",[id,owner,actor,'0'.repeat(64)]);
 assert.equal((await c.query('SELECT * FROM gymos.gym_activity_archive WHERE owner_id=$1',[owner])).rowCount,1);
 await c.query("SELECT set_config('app.gym_actor',$1,true)",[randomUUID()]);assert.equal((await c.query('SELECT * FROM gymos.gym_backup_transfers WHERE id=$1',[id])).rowCount,0);
 await c.query("SELECT set_config('app.gym_owner',$1,true)",['foreign:'+owner]);assert.equal((await c.query('SELECT * FROM gymos.gym_activity_archive WHERE owner_id=$1',[owner])).rowCount,0);
 await c.query('SAVEPOINT immutable');await assert.rejects(()=>c.query('DELETE FROM gymos.gym_activity_archive WHERE owner_id=$1',[owner]),e=>e.code==='42501');await c.query('ROLLBACK TO SAVEPOINT immutable');
 }finally{await c.query('ROLLBACK');c.release();}
});
