import {serverAuth} from '../../lib/auth';
import {loginCode,loginCredentials} from '../../lib/login-errors';
export const dynamic='force-dynamic';
const reply=(body:unknown,status:number)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
export async function DELETE(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'origin'},403);
 try{
  const auth=await serverAuth();
  const {error}=await auth.auth.signOut({scope:'local'});
  if(error)return reply({error:'signout_failed'},400);
  return reply({ok:true},200);
 }catch{return reply({error:'connection'},503);}
}

export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'origin'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 try{const raw=await request.text();if(new TextEncoder().encode(raw).length>4096)return reply({error:'invalid'},413);const credentials=loginCredentials(JSON.parse(raw));if(!credentials)return reply({error:'invalid_credentials'},400);
 const auth=await serverAuth();const result=await auth.auth.signInWithPassword(credentials);if(result.error)return reply({error:loginCode(result.error)},result.error.status===429?429:400);if(!result.data.session)return reply({error:'auth_failed'},401);return reply({ok:true},200);
 }catch{return reply({error:'connection'},503);}
}
