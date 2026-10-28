import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import sharp from 'sharp';

test('Every launcher uses the same uncropped square symbol at its advertised resolution',async()=>{
 for(const role of ['icon','members','support'])for(const size of [192,512]){
  const actual=await sharp(`public/icons/${role}-${size}.png`).raw().toBuffer({resolveWithObject:true});
  const expected=await sharp('public/brand/compact-icon.svg').resize(size,size).raw().toBuffer();
  assert.equal(actual.info.width,size);assert.equal(actual.info.height,size);
  assert.deepEqual(actual.data,expected,role+' '+size);
 }
});

test('Android launchers keep coloured foreground separate from themed monochrome artwork',async()=>{
 for(const folder of ['mobile-android/members','mobile-android/management','android','android-management','android-support']){
  const adaptive=await readFile(folder+'/res/mipmap-anydpi-v33/ic_launcher.xml','utf8');
  assert.match(adaptive,/<foreground android:drawable="@drawable\/ic_launcher_foreground"/);
  assert.match(adaptive,/<monochrome android:drawable="@drawable\/ic_monochrome"/);
  const foreground=await readFile(folder+'/res/drawable/ic_launcher_foreground.xml','utf8');
  assert.match(foreground,/#FFA855F7/);
  assert.doesNotMatch(foreground,/L244,155 L145,155/,'Old overlapping G bar must not return');
 }
});
