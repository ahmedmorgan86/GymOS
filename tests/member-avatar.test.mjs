import {test} from 'node:test';
import assert from 'node:assert/strict';
import {demoMemberAvatarPath} from '../app/lib/demo-member-avatar.ts';
test('Demo portraits use deterministic, fictional images and never replace a real member photo',()=>{
 assert.equal(demoMemberAvatarPath({id:'sample-full-member-0001',demo:false,name:'أحمد حسن'}),'/demo-members/male-2.jpg');
 assert.equal(demoMemberAvatarPath({id:'demo-uuid-8',demo:true,gender:'female',name:'مريم أحمد'}),'/demo-members/female-1.jpg');
 assert.equal(demoMemberAvatarPath({id:'demo-uuid-8',demo:true,name:'مريم أحمد'}),'/demo-members/female-1.jpg');
 assert.equal(demoMemberAvatarPath({id:'member-real-1',demo:false,name:'أحمد حسن'}),null);
});
