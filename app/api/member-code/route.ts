import {context,readSpace,reply,sameOrigin} from '../../lib/server-workspace';
import {withScope} from '../../lib/database';
import {assertRequestTenant} from '../../lib/request-tenant';
import {licenseState,CommercialError} from '../../lib/licensing';
import {normalizeMemberPhone,newMemberPin} from '../../lib/member-phone';
export async function POST(request:Request){try{
 if(!sameOrigin(request))return reply({error:'origin'},403);if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);const ctx=await context();if(!ctx||!['owner','manager'].includes(ctx.role))return reply({error:'forbidden'},403);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.license&&!licenseState(ctx.license).writable)return reply({error:'licenseReadOnly'},403);
 const raw=await request.text();if(raw.length>2048)return reply({error:'invalid'},413);const body=JSON.parse(raw),{state}=await readSpace(ctx.owner);
 const m=state.members.find(m=>m.id===body.member&&!m.demo&&!m.archived);if(!m||ctx.branches&&!ctx.branches.includes(m.branch))return reply({error:'forbidden'},403);
 if(!['read','rotate','revoke'].includes(body.action))return reply({error:'invalid'},400);
 const result=await withScope(ctx.owner,async c=>{await c.query('SELECT gymos.sync_member_codes($1::jsonb)',[JSON.stringify(state.members)]);
  if(body.action==='revoke'){await c.query('UPDATE gymos.member_code_access SET revoked=true,version=version+1 WHERE owner_id=$1 AND member_id=$2',[ctx.owner,m.id]);await c.query('UPDATE gymos.member_portal_access SET revoked=true,invite_hash=NULL WHERE owner_id=$1 AND member_id=$2',[ctx.owner,m.id]);return{revoked:true};}
  if(body.action==='rotate'){if(!normalizeMemberPhone(m.phone))return{phone:null,pin:null,needsPhone:true};const pin=newMemberPin();await c.query('UPDATE gymos.member_code_access SET pin_hash=gymos.member_pin_hash($1),pin_cipher=gymos.member_pin_encrypt($1),pin_must_change=true,version=version+1,revoked=false WHERE owner_id=$2 AND member_id=$3',[pin,ctx.owner,m.id]);await c.query('DELETE FROM gymos.member_code_sessions WHERE owner_id=$1 AND member_id=$2',[ctx.owner,m.id]);await c.query('INSERT INTO gymos.gym_access_events(id,owner_id,actor,target,action,details) VALUES($1,$2,$3,$4,$5,$6::jsonb)',[crypto.randomUUID(),ctx.owner,ctx.user.userId,m.id,'member.pin.rotate',JSON.stringify({branch:m.branch})]);}
  const row=(await c.query('SELECT CASE WHEN pin_cipher IS NOT NULL THEN gymos.member_code_decrypt(pin_cipher) END AS pin,revoked,pin_must_change FROM gymos.member_code_access WHERE owner_id=$1 AND member_id=$2',[ctx.owner,m.id])).rows[0];return{phone:normalizeMemberPhone(m.phone),pin:row.revoked||row.pin==='123456'?null:row.pin,needsActivation:row.pin_must_change&&row.pin==='123456',revoked:row.revoked,needsPhone:!normalizeMemberPhone(m.phone),pinChanged:!row.pin_must_change};
 });return reply(result);
}catch(e){if(e instanceof CommercialError)return reply({error:e.code},e.status);return reply({error:'unavailable'},503);}}
