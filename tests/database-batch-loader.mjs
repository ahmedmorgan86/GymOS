import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='pg')return{url:'qa:batch-pg',shortCircuit:true};return next(specifier,context);},load(url,context,next){if(url==='qa:batch-pg')return{format:'module',shortCircuit:true,source:'export class Pool{on(){}async connect(){return globalThis.__batchClient();}}'};return next(url,context);}});
