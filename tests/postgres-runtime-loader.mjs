// Test-only adapter: production database.ts keeps strict TLS unchanged.
import {registerHooks,createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const realPg=pathToFileURL(createRequire(import.meta.url).resolve('pg')).href;
registerHooks({resolve(specifier,context,next){if(specifier==='pg'&&context.parentURL?.endsWith('/app/lib/database.ts'))return{url:'qa:local-postgres',shortCircuit:true};return next(specifier,context);},load(url,context,next){if(url==='qa:local-postgres')return{format:'module',shortCircuit:true,source:`import pg from ${JSON.stringify(realPg)};export class Pool extends pg.Pool{constructor(options){const u=new URL(options.connectionString);if(u.hostname!=='127.0.0.1'||u.pathname!=='/gymos_ci')throw Error('Only disposable loopback CI database allowed');super({...options,ssl:false});}}`};return next(url,context);}});
