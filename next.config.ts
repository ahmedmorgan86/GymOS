import type {NextConfig} from 'next';
import {join} from 'node:path';
const config:NextConfig={images:{localPatterns:[{pathname:'/**',search:''},{pathname:'/images/**',search:'?v=20261027'},{pathname:'/icons/**',search:'?v=20261027'}]},serverExternalPackages:['pg'],poweredByHeader:false,outputFileTracingRoot:process.cwd(),outputFileTracingIncludes:{'/*':['./certs/supabase-ca.crt','./public/icons/icon-512.png']},webpack(config){
 // Human's node export otherwise pulls native TensorFlow into the SSR build.
 // Camera inference is loaded only on demand in the client component.
 config.resolve.alias={...config.resolve.alias,'@vladmandic/human$':join(process.cwd(),'node_modules/@vladmandic/human/dist/human.esm.js')};
 return config;
}};
export default config;
