import {test} from 'node:test';
import assert from 'node:assert/strict';
import {entityChanges,assembleState,splitState} from '../app/lib/entity-state.ts';
import {emptyState} from '../app/lib/domain.ts';
const event=i=>({id:'e'+i,at:new Date(Date.UTC(2026,9,20,0,0,i)).toISOString(),kind:'test',subject:'workspace',actor:'Test',branch:'main'});
test('Rolling activity window inserts one event without rewriting 1999 retained events',()=>{
 const state=emptyState();state.events=Array.from({length:2000},(_,i)=>event(i));const next={...state,events:[...state.events.slice(1),event(2000)]};
 const delta=entityChanges(splitState(state).entities,splitState(next).entities);assert.equal(delta.upserts.length,1);assert.equal(delta.removed.length,1);assert.equal(delta.upserts[0].entity_id,'e2000');
});
test('Archive transition identifies every old entity and reconstructs chronological history despite stale positions',()=>{
 const state=emptyState();state.events=Array.from({length:50001},(_,i)=>event(i));const before=splitState(state),after=splitState({...state,events:state.events.slice(-2000)});const delta=entityChanges(before.entities,after.entities);assert.equal(delta.removed.length,48001);assert.equal(delta.upserts.length,0);
 const removed=new Set(delta.removed.map(x=>x.entity_id));const retained=before.entities.filter(e=>!removed.has(e.entity_id));const last=event(50001);retained.push({collection:'events',entity_id:last.id,position:0,branch:'main',payload:last});
 const rebuilt=assembleState(after.metadata,retained,{});assert.equal(rebuilt.events.at(-1).id,last.id);assert.equal(rebuilt.events.length,2001);
});
