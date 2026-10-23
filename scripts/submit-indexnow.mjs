// Public URLs only. Run after the production deployment is verified.
import {readFile} from 'node:fs/promises';
import {siteOrigin,publicPaths} from '../app/lib/seo.ts';
const origin=siteOrigin(),key=(await readFile(new URL('../public/indexnow-key.txt',import.meta.url),'utf8')).trim();
if(!/^[a-f0-9]{32}$/.test(key))throw Error('Invalid public IndexNow key');
const payload={host:new URL(origin).hostname,key,keyLocation:origin+'/indexnow-key.txt',urlList:publicPaths.map(p=>origin+p)};
if(!process.argv.includes('--submit')){console.log(JSON.stringify({mode:'preview',...payload},null,2));process.exit(0);}
for(const path of ['/indexnow-key.txt','/sitemap.xml',...publicPaths]){const response=await fetch(origin+path,{redirect:'manual',signal:AbortSignal.timeout(20000)});if(response.status!==200)throw Error('Public preflight failed: '+path+' '+response.status);const body=await response.text();if(path==='/indexnow-key.txt'&&body.trim()!==key)throw Error('Deployed key does not match source');if(publicPaths.includes(path)&&(/noindex/i.test(response.headers.get('x-robots-tag')??'')||/<meta[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(body)))throw Error('Public page is not indexable: '+path);}
const response=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(30000)});
console.log(JSON.stringify({status:response.status,submitted:payload.urlList,accepted:[200,202].includes(response.status),note:'Acceptance is notification only; indexing and ranking are not guaranteed.'}));
if(![200,202].includes(response.status))process.exitCode=1;
