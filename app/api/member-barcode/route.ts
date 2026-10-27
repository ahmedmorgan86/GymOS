import {reserveDailyCard} from '../../lib/card-number';
import {context,readSpace,reply,sameOrigin} from '../../lib/server-workspace';
import {assertRequestTenant} from '../../lib/request-tenant';
import {withScope} from '../../lib/database';
import {receptionPermitted} from '../../lib/access';
import {CommercialError,licenseState} from '../../lib/licensing';
import {dayAt,RuleError} from '../../lib/domain';
import {validCard} from '../../lib/member-console';
export async function POST(request:Request){try{
 if(!sameOrigin(request))return reply({error:'origin'},403);const ctx=await context();if(!ctx)return reply({error:'auth'},401);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.support||ctx.license&&!licenseState(ctx.license).writable)return reply({error:'forbidden'},403);
 const raw=await request.text();if(raw.length>1000)return reply({error:'invalid'},400);const b=JSON.parse(raw);if(!b||typeof b!=='object'||Array.isArray(b)||typeof b.member!=='string'||typeof b.branch!=='string'||b.code!==undefined&&typeof b.code!=='string')return reply({error:'invalid'},400);const {state}=await readSpace(ctx.owner);if(!state.branches.some(x=>x.id===b.branch)||ctx.branches&&!ctx.branches.includes(b.branch))return reply({error:'forbidden'},403);
 const existing=state.members.find(m=>m.id===b.member);if(existing&&existing.branch!==b.branch)return reply({error:'forbidden'},403);
 if(existing?.archived)return reply({error:'inactive'},400);if(!existing&&!/^[-a-zA-Z0-9]{16,80}$/.test(b.member))return reply({error:'invalid'},400);
 if(!receptionPermitted(ctx.role,state.members.some(m=>m.id===b.member)?'card.replace':'member.register',state.settings.receptionGrants?.[ctx.user.userId]))return reply({error:'forbidden'},403);
 const code=await withScope(ctx.owner,async c=>{if(!b.code)return reserveDailyCard(c,ctx.owner,b.member,b.branch,dayAt(new Date().toISOString(),state.settings.timezone));const code=validCard(b.code);const reserved=(await c.query("INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status) VALUES($1,$2,$3,$4,'reserved') ON CONFLICT(code) DO UPDATE SET code=excluded.code WHERE membership_cards.owner_id=excluded.owner_id AND membership_cards.member_id=excluded.member_id AND membership_cards.status='reserved' RETURNING code",[code,ctx.owner,b.member,b.branch])).rowCount;return reserved?code:null;});
 if(!code)return reply({error:'cardUsed'},409);return reply({code});
 }catch(e){if(e instanceof CommercialError)return reply({error:e.code},e.status);if(e instanceof RuleError)return reply({error:e.code},400);if(e instanceof SyntaxError)return reply({error:'invalid'},400);if(e&&typeof e==='object'&&'code' in e&&e.code==='23505')return reply({error:'cardUsed'},409);console.error('Barcode reservation failed',{code:e&&typeof e==='object'&&'code' in e?String(e.code):'unknown'});return reply({error:'barcodeUnavailable'},503);}}
