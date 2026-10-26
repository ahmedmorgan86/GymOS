import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const script=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
function worker(){const origin='https://gym.test',handlers={},records=new Map();let network=true;const fixtures=new Map([['/',new Response('<title>Public website</title>',{headers:{'Content-Type':'text/html'}})],['/?workspace=1',new Response('<title>GYM OS</title><meta name="gymos-offline-shell" content="1"><script src="/assets/main.js"></script><link href="/assets/app.css" rel="stylesheet">',{headers:{'Content-Type':'text/html'}})],['/assets/main.js',new Response('import "./chunk.js";')],['/assets/chunk.js',new Response('export const ready=true;')],['/assets/app.css',new Response('@font-face{src:url(/fonts/cairo.ttf)}')],['/fonts/cairo.ttf',new Response('font data')]]);
 const key=value=>new URL(typeof value==='string'?value:value.url,origin).href;
 const cache={put:async(k,v)=>records.set(key(k),v.clone()),match:async k=>records.get(key(k))?.clone()};
 const caches={open:async()=>cache,match:cache.match,keys:async()=>[],delete:async()=>true};
 const self={location:new URL(origin),clients:{claim:async()=>{}},skipWaiting(){},addEventListener:(type,callback)=>handlers[type]=callback};
 vm.runInNewContext(script,{self,caches,URL,Set,Response,fetch:async value=>{if(!network)throw Error('offline');return fixtures.get(new URL(value,origin).pathname+new URL(value,origin).search)?.clone()??new Response('missing',{status:404});}});
 return{handlers,records,fixtures,offline:()=>network=false,origin};
}
test('Offline shell preparation follows JS and CSS/font dependencies, serves cached shell/assets, never intercepts API',async()=>{const w=worker();let ready;let preparation;w.handlers.message({data:{type:'PREPARE',urls:[]},ports:[{postMessage:v=>ready=v}],waitUntil:p=>preparation=p});await preparation;assert.equal(ready.ok,true);for(const path of ['/?workspace=1','/assets/main.js','/assets/chunk.js','/assets/app.css','/fonts/cairo.ttf'])assert.ok(w.records.has(w.origin+path),path);w.offline();let response;w.handlers.fetch({request:{url:w.origin+'/?workspace=1',method:'GET',mode:'navigate'},respondWith:p=>response=p});assert.match(await(await response).text(),/GYM OS/);response=undefined;w.handlers.fetch({request:{url:w.origin+'/assets/chunk.js',method:'GET'},respondWith:p=>response=p});assert.match(await(await response).text(),/ready=true/);let intercepted=false;w.handlers.fetch({request:{url:w.origin+'/api/workspace',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);});
test('Preparation failure is reported, rather than claiming the offline shell is complete',async()=>{const w=worker();w.fixtures.delete('/assets/chunk.js');let ready,pending;w.handlers.message({data:{type:'PREPARE',urls:[]},ports:[{postMessage:v=>ready=v}],waitUntil:p=>pending=p});await pending;assert.equal(ready.ok,false);});
