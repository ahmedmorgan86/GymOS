import {registerHooks} from 'node:module';
import './role-api-loader.mjs';
registerHooks({load(url,context,next){if(url.endsWith('/app/chatgpt-auth.ts'))return{format:'module',shortCircuit:true,source:'export const getChatGPTUser=async()=>globalThis.__qaContext?.user??null;'};return next(url,context);}});
