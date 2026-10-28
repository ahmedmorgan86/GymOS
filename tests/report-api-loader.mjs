import './role-api-loader.mjs';import {registerHooks} from 'node:module';
registerHooks({load(url,ctx,next){if(url.endsWith('/app/lib/database.ts'))return{format:'module',shortCircuit:true,source:`export async function withScope(owner,work){return work({query:async(sql,params)=>{globalThis.__reportQuery={owner,sql,params};return{rows:[]};}});}`};return next(url,ctx);}});
