import {fullName,memberPhone} from '../../lib/member-console';
import {assertRequestTenant} from '../../lib/request-tenant';
import {CommercialError,licenseState} from '../../lib/licensing';
import {persistSpace} from '../../lib/entity-store';
import {applyOperation,RuleError,type Operation} from '../../lib/domain';
import {receptionPermitted} from '../../lib/access';
import {administrator,context,readSpace,packet,reply,sameOrigin,hash} from '../../lib/server-workspace';
import {workspaceUniqueError} from '../../lib/workspace-error';
export const dynamic='force-dynamic';
export const maxDuration=300;
export async function GET(request:Request){try{const ctx=await context();if(!ctx)return reply({error:'auth'},401);if(request.headers.has('x-gymos-tenant'))assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));return reply(packet(await readSpace(ctx.owner),ctx));}catch(e){if(e instanceof CommercialError)return reply({error:e.code},e.status);return reply({error:e instanceof Error&&e.message==='forbidden'?'forbidden':'unavailable'},e instanceof Error&&e.message==='forbidden'?403:503);}}
export async function POST(request:Request){try{
 if(!sameOrigin(request))return reply({error:'origin'},403);if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 const ctx=await context();if(!ctx)return reply({error:'auth'},401);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.support)return reply({error:'supportReadOnly'},403);if(ctx.license&&!licenseState(ctx.license).writable)return reply({error:'licenseReadOnly'},403);const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>1_600_000)return reply({error:'limit'},413);
 const body=JSON.parse(raw) as{revision:number;requestId:string;operation:Operation};if(!body||!Number.isSafeInteger(body.revision)||typeof body.requestId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(body.requestId)||!body.operation||typeof body.operation.type!=='string')return reply({error:'invalid'},400);
 const current=await readSpace(ctx.owner);if(!receptionPermitted(ctx.role,body.operation.type,current.state.settings.receptionGrants?.[ctx.user.userId])||(ctx.branches&&!ctx.branches.includes(body.operation.branch)))return reply({error:'forbidden'},403);
 if(['legacy.import','settings.save','logo.set','branch.add','demo.seed','demo.clear'].includes(body.operation.type)&&!(await administrator(ctx)))return reply({error:'forbidden'},403);
 if(['member.save','member.daypass'].includes(body.operation.type)){body.operation.name=fullName(body.operation.name);body.operation.phone=memberPhone(body.operation.phone);}
 const digest=await hash(JSON.stringify(body.operation)),receipt=current.state.receipts.find(r=>r.id===ctx.user.userId+':'+body.requestId);
 if(receipt){if(receipt.digest!==digest)return reply({error:'replay'},409);return reply(packet(current,ctx));}if(body.revision!==current.revision)return reply({error:'conflict'},409);
 let state=applyOperation(current.state,body.operation,new Date().toISOString(),ctx.user.displayName,()=>crypto.randomUUID());if(body.operation.type==='member.save'&&!body.operation.id){const added=state.members.at(-1)!;state=applyOperation(state,{type:'card.issue',branch:body.operation.branch,id:added.id},new Date().toISOString(),ctx.user.displayName,()=>crypto.randomUUID());}state.receipts.push({id:ctx.user.userId+':'+body.requestId,digest});if(state.receipts.length>1000)state.receipts.shift();const payload=JSON.stringify(state);if(new TextEncoder().encode(payload).byteLength>20_000_000)return reply({error:'limit'},413);
 if(!await persistSpace(ctx.owner,current,state))return reply({error:'conflict'},409);return reply(packet({state,revision:current.revision+1},ctx));
 }catch(e){const unique=workspaceUniqueError(e);if(unique)return reply({error:unique},409);if(e instanceof CommercialError)return reply({error:e.code},e.status);if(e instanceof RuleError)return reply({error:e.code},400);if(e instanceof SyntaxError||e instanceof RangeError)return reply({error:'invalid'},400);return reply({error:e instanceof Error&&e.message==='forbidden'?'forbidden':'unavailable'},e instanceof Error&&e.message==='forbidden'?403:503);}}
