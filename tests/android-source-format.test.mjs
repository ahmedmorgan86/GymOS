import {test} from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
test('Android source provenance is portable across Windows and Linux checkouts',()=>{
 for(const [folder,meta]of [['android','member-android'],['android-management','management-android'],['android-support','support-android'],['mobile-android/members','gymeg-members-android'],['mobile-android/management','gymeg-management-android']]){
  const release=JSON.parse(readFileSync('public/downloads/'+meta+'.json','utf8'));
  for(const name of Object.keys(release.sourceHashes)){assert.ok(!name.includes('\\'),'Source paths must be POSIX: '+name);if(/\.(xml|java)$/.test(name))assert.ok(!readFileSync(folder+'/'+name).includes(Buffer.from('\r\n')),'Source checksums require LF: '+folder+'/'+name);}
 }
});
