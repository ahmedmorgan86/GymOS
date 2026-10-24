import {registerHooks} from 'node:module';
import './commercial-loader.mjs';
registerHooks({load(url,context,next){
 if(url.endsWith('/app/lib/database.ts'))return{format:'module',shortCircuit:true,source:'export const withScope=async(owner,fn)=>{globalThis.__credentialOwner=owner;return fn(globalThis.__credentialClient);};'};
 if(url.endsWith('/app/lib/server-workspace.ts'))return{format:'module',shortCircuit:true,source:'export const context=async()=>globalThis.__credentialContext;export const readSpace=async()=>globalThis.__credentialSpace;export const reply=(data,status=200)=>Response.json(data,{status});export const sameOrigin=request=>request.headers.get("origin")===new URL(request.url).origin;'};
 return next(url,context);
}});
