import {join} from 'node:path';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const pins=JSON.parse(readFileSync('docs/identity/android-signing-certificates.json','utf8'));
const sdk=process.env.ANDROID_HOME??process.env.ANDROID_SDK_ROOT;
const tools=sdk?join(sdk,'build-tools'):null;
const candidates=tools&&existsSync(tools)?readdirSync(tools).sort((a,b)=>b.localeCompare(a,undefined,{numeric:true})).map(v=>join(tools,v,'apksigner')).filter(p=>existsSync(p)):[];
const signer=process.env.ANDROID_APK_SIGNER??candidates[0];
if(!signer)throw Error('ANDROID_APK_SIGNER must point to the official Android SDK apksigner');
for(const [name,pin] of Object.entries(pins)){
 if(createHash('sha256').update(readFileSync(pin.file)).digest('hex')!==pin.apkSha256)throw Error(name+' APK hash differs from reviewed release');
 const output=execFileSync(signer,['verify','--verbose','--print-certs',pin.file],{encoding:'utf8'});
 console.log(output);
 const digests=[...output.matchAll(/^[^\r\n]*certificate SHA-256 digest:[ \t]*([a-f0-9]{64})[ \t]*$/gim)].map(m=>m[1].toLowerCase());
 const digest=digests[0];
 if(!digests.length||digests.some(d=>d!==pin.certificateSha256)||!/^Number of signers: 1$/m.test(output))throw Error(name+' signing certificate differs from original reviewed APK');
 console.log(name+': signature verified; original certificate '+digest);
}
