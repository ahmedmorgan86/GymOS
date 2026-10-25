import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';import {unzipSync,strFromU8} from 'fflate';
for(const variant of ['management','support']){
 test(`Android ${variant} artifact matches source and denies unsafe WebView capabilities`,()=>{
  const release=JSON.parse(readFileSync(new URL(`../public/downloads/${variant}-android.json`,import.meta.url)));
  const bytes=readFileSync(new URL('../public'+release.url,import.meta.url));
  assert.equal(bytes.length,release.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);
  for(const [path,hash] of Object.entries(release.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(new URL(`../android-${variant}/`+path,import.meta.url))).digest('hex'),hash,path);
  const files=unzipSync(bytes);
  assert.ok(strFromU8(files['classes.dex']).includes(`com/gymos/${variant}/MainActivity`));
  assert.ok(!Object.keys(files).some(n=>/\.(jks|keystore|env|key)$/.test(n)));
  const java=readFileSync(new URL(`../android-${variant}/src/com/gymos/${variant}/MainActivity.java`,import.meta.url),'utf8');
  assert.ok(java.includes('handler.cancel()'));
  assert.ok(!java.includes('handler.proceed()'));
  assert.ok(!java.includes('addJavascriptInterface'));
  assert.ok(java.includes('setAllowFileAccess(false)'));
  assert.ok(java.includes('setAllowContentAccess(false)'));
  assert.ok(java.includes('if(!gesture)return false'));
  assert.ok(java.includes('request.hasGesture()'));
 });
}
test('Published Android APK matches download metadata and contains compiled activity/resources without private keys',()=>{const release=JSON.parse(readFileSync(new URL('../public/downloads/member-android.json',import.meta.url))),bytes=readFileSync(new URL('../public'+release.url,import.meta.url));assert.equal(bytes.length,release.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),release.sha256);assert.ok(Object.keys(release.sourceHashes).length>=6);for(const [path,hash]of Object.entries(release.sourceHashes))assert.equal(createHash('sha256').update(readFileSync(new URL('../android/'+path,import.meta.url))).digest('hex'),hash,'APK source changed: '+path);const files=unzipSync(bytes);for(const file of ['classes.dex','AndroidManifest.xml','resources.arsc'])assert.ok(files[file],file);assert.match(strFromU8(files['classes.dex']),/com\/gymos\/members\/MainActivity/);assert.ok(!Object.keys(files).some(n=>/\.(jks|keystore|env|key)$/.test(n)));});
test('Android member shell requires HTTPS, cancels SSL failures and exposes no JavaScript/file bridge',()=>{const java=readFileSync(new URL('../android/src/com/gymos/members/MainActivity.java',import.meta.url),'utf8'),manifest=readFileSync(new URL('../android/AndroidManifest.xml',import.meta.url),'utf8');assert.ok(java.includes('handler.cancel()'));assert.ok(!java.includes('handler.proceed()'));assert.ok(java.includes('setAllowFileAccess(false)'));assert.ok(java.includes('setAllowContentAccess(false)'));assert.ok(java.includes('setAcceptThirdPartyCookies(web,false)'));assert.ok(!java.includes('addJavascriptInterface'));assert.ok(manifest.includes('android:usesCleartextTraffic="false"'));assert.equal((manifest.match(/<uses-permission/g)??[]).length,1);assert.ok(manifest.includes('android.permission.INTERNET'));});
