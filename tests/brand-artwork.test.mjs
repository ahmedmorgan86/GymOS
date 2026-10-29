import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

test('Role launchers have their advertised square resolution, visible artwork and distinct identities',async()=>{
 for(const size of [192,512]){
  const roles=[];
  for(const role of ['icon','members','support']){
   const actual=await sharp(`public/icons/${role}-${size}.png`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   assert.equal(actual.info.width,size);assert.equal(actual.info.height,size);
   const colors=new Set();for(let i=0;i<actual.data.length;i+=4)if(actual.data[i+3]>0)colors.add(actual.data.subarray(i,i+3).toString('hex'));
   assert.ok(colors.size>10,role+' has visible detailed artwork');roles.push(actual.data.toString('base64'));
  }
  assert.equal(new Set(roles).size,3,'Management, members and support must be visually distinct');
 }
});

test('Android launchers keep coloured foreground separate from themed monochrome artwork',async()=>{
 for(const folder of ['mobile-android/members','mobile-android/management','android','android-management','android-support']){
  const adaptive=await readFile(folder+'/res/mipmap-anydpi-v33/ic_launcher.xml','utf8');
  assert.match(adaptive,/<foreground android:drawable="@drawable\/ic_launcher_foreground"/);
  assert.match(adaptive,/<monochrome android:drawable="@drawable\/ic_monochrome"/);
  const foreground=await readFile(folder+'/res/drawable/ic_launcher_foreground.xml','utf8');
  assert.match(foreground,/android:fillColor="#FF(?!FFFFFF)[A-Fa-f0-9]{6}"/);
  const monochrome=await readFile(folder+'/res/drawable/ic_monochrome.xml','utf8');
  assert.match(monochrome,/#FFFFFFFF/);
  assert.doesNotMatch(foreground,/L244,155 L145,155/,'Old overlapping G bar must not return');
 }
});
