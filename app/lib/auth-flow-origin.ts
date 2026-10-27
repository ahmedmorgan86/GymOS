// Keep PKCE registration/recovery on one approved origin during a domain migration.
// Remove the compatibility origin only after the Auth provider accepts the new callback URL.
export function authFlowOrigin(){const value=process.env.NEXT_PUBLIC_AUTH_FLOW_ORIGIN;if(!value)return null;const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)throw Error('Invalid authentication flow origin');return url.origin;}
export function authEntry(path:'/forgot-password'|'/sign-in?register=1'){const origin=authFlowOrigin();return origin?origin+path:path;}
export function redirectAuthFlow(host:string|null){const origin=authFlowOrigin();return origin&&host&&new URL(origin).host!==host?origin:null;}
