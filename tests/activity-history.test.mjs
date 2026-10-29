import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activityPage} from '../app/lib/activity-history.ts';
const event=(id,at,branch='one')=>({id,at,kind:'test',subject:'workspace',actor:'Test',branch});
test('Activity history merges archived and current events, de-duplicates, and isolates branches',()=>{
 const archived=[event('old','2026-10-01T09:00:00Z'),event('same','2026-10-02T09:00:00Z'),event('other-branch','2026-10-04T09:00:00Z','two')],recent=[event('new','2026-10-03T09:00:00Z'),event('same','2026-10-02T09:00:00Z'),event('tenant-leak','2026-10-05T09:00:00Z','foreign')];
 assert.deepEqual(activityPage(archived,recent,'one').map(x=>x.id),['new','same','old']);
});
test('Activity history cursor uses the same descending time and identifier boundary as SQL pagination',()=>{
 const rows=[event('a','2026-10-02T09:00:00Z'),event('b','2026-10-02T09:00:00Z'),event('c','2026-10-01T09:00:00Z')];
 assert.deepEqual(activityPage(rows,[],'one',{at:'2026-10-02T09:00:00Z',id:'b'}).map(x=>x.id),['a','c']);
});
