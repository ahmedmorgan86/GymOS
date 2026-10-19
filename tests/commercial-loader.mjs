// Integration-test-only resolution for Node's native TypeScript runner.
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){if(specifier==='server-only')return{url:'data:text/javascript,export{}',shortCircuit:true};try{return next(specifier,context);}catch(error){if(error.code==='ERR_MODULE_NOT_FOUND'&&specifier.startsWith('.')&&!/\.[a-z]+$/i.test(specifier))return next(specifier+'.ts',context);throw error;}}});
