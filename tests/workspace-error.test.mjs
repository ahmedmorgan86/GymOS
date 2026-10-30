import {test} from 'node:test';
import assert from 'node:assert/strict';
import {workspaceUniqueError} from '../app/lib/workspace-error.ts';

test('only actual card registry conflicts are reported as barcode errors',()=>{
  assert.equal(workspaceUniqueError({code:'23505',constraint:'membership_cards_pkey'}),'cardUsed');
  assert.equal(workspaceUniqueError({code:'23505',message:'Barcode already used'}),'cardUsed');
  assert.equal(workspaceUniqueError({code:'23505',constraint:'gym_visit_one_open'}),'duplicateVisit');
  assert.equal(workspaceUniqueError({code:'23505',constraint:'some_other_unique_index'}),'duplicateRecord');
  assert.equal(workspaceUniqueError({code:'08006'}),null);
});
