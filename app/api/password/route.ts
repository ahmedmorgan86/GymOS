import {serverAuth} from '../../lib/auth';
export const dynamic='force-dynamic';
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'origin'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 try{const raw=await request.text();if(raw.length>2048)return reply({error:'limit'},413);const body=JSON.parse(raw);const auth=await serverAuth();
 if(body.action==='request'){if(typeof body.email!=='string'||body.email.length>254||!/^\S+@\S+\.\S+$/.test(body.email.trim()))return reply({error:'invalid'},400);const redirectBase=process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL??new URL('/auth/callback',request.url).href;
 const redirectTo=new URL(redirectBase);
 redirectTo.searchParams.set('next','/reset-password');
 const {error}=await auth.auth.resetPasswordForEmail(body.email.trim(),{redirectTo:redirectTo.href});if(error?.status===429)return reply({error:'rate'},429);if(error&&error.status&&error.status>=500)return reply({error:'unavailable'},503);return reply({ok:true});}
 if(body.action==='update'){if(typeof body.password!=='string'||body.password.length<12||body.password.length>128)return reply({error:'invalid'},400);const user=await auth.auth.getUser();if(user.error||!user.data.user)return reply({error:'auth'},401);const result=await auth.auth.updateUser({password:body.password});if(result.error)return reply({error:'invalid'},400);return reply({ok:true});}
 return reply({error:'invalid'},400);
 }catch{return reply({error:'unavailable'},503);}
}
