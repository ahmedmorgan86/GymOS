import {randomUUID} from 'node:crypto';
import {context,readSpace,reply,sameOrigin} from '../../lib/server-workspace';
import {assertRequestTenant} from '../../lib/request-tenant';
import {withScope} from '../../lib/database';
import {receptionPermitted} from '../../lib/access';
import {licenseState} from '../../lib/licensing';
import {validCard} from '../../lib/member-console';
export async function POST(request:Request){try{
 if(!sameOrigin(request))return reply({error:'origin'},403);const ctx=await context();if(!ctx)return reply({error:'auth'},401);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.support||ctx.license&&!licenseState(ctx.license).writable)return reply({error:'forbidden'},403);
 const raw=await request.text();if(raw.length>1000)return reply({error:'invalid'},400);const b=JSON.parse(raw),{state}=await readSpace(ctx.owner);if(typeof b.member!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(b.member)||typeof b.branch!=='string'||!state.branches.some(x=>x.id===b.branch)||ctx.branches&&!ctx.branches.includes(b.branch))return reply({error:'forbidden'},403);
 const existing=state.members.find(m=>m.id===b.member);if(existing&&existing.branch!==b.branch)return reply({error:'forbidden'},403);
 if(!receptionPermitted(ctx.role,state.members.some(m=>m.id===b.member)?'card.replace':'member.register',state.settings.receptionGrants?.[ctx.user.userId]))return reply({error:'forbidden'},403);
 const code=b.code?validCard(b.code):'GOS'+randomUUID().replaceAll('-','').toUpperCase();const reserved=await withScope(ctx.owner,async c=>(await c.query("INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status) VALUES($1,$2,$3,$4,'reserved') ON CONFLICT(code) DO UPDATE SET code=excluded.code WHERE membership_cards.owner_id=excluded.owner_id AND membership_cards.member_id=excluded.member_id AND membership_cards.status='reserved' RETURNING code",[code,ctx.owner,b.member,b.branch])).rowCount);
 if(!reserved)return reply({error:'cardUsed'},409);return reply({code});
 }catch{return reply({error:'barcodeUnavailable'},503);}}
