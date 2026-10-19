import type {NextConfig} from 'next';
const config:NextConfig={serverExternalPackages:['pg'],poweredByHeader:false,outputFileTracingRoot:process.cwd(),outputFileTracingIncludes:{'/*':['./certs/supabase-ca.crt','./public/icons/icon-512.png']}};
export default config;
