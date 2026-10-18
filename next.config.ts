import type {NextConfig} from 'next';
const config:NextConfig={serverExternalPackages:['pg'],poweredByHeader:false,outputFileTracingRoot:process.cwd(),outputFileTracingIncludes:{'/*':['./certs/supabase-ca.crt']}};
export default config;
