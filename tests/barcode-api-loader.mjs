import './role-api-loader.mjs';
import {registerHooks} from 'node:module';
registerHooks({load(url,ctx,next){if(url.endsWith('/app/lib/database.ts'))return {format:'module',shortCircuit:true,source:`export async function withScope(owner,work){if(globalThis.__barcodeFailure)throw globalThis.__barcodeFailure;return globalThis.__barcodeDb.transaction(async c=>{await c.query("SELECT set_config('app.gym_owner',$1,true)",[owner]);return work(c);});}`};return next(url,ctx);}});
