import {assertRequestTenant} from '../../lib/request-tenant';
import {CommercialError,licenseState} from '../../lib/licensing';
import {persistSpace} from '../../lib/entity-store';
import {applyOperation,RuleError,type Operation} from '../../lib/domain';
import {permitted,attendanceGranted} from '../../lib/access';
import {administrator,context,readSpace,packet,reply,sameOrigin,hash} from '../../lib/server-workspace';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{const ctx=await context();if(!ctx)return reply({error:'auth'},401);if(request.headers.has('x-gymos-tenant'))assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));return reply(packet(await readSpace(ctx.owner),ctx));}catch(e){if(e instanceof CommercialError)return reply({error:e.code},e.status);return reply({error:e instanceof Error&&e.message==='forbidden'?'forbidden':'unavailable'},e instanceof Error&&e.message==='forbidden'?403:503);}}
export async function POST(request:Request){try{
 if(!sameOrigin(request))return reply({error:'origin'},403);if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 const ctx=await context();if(!ctx)return reply({error:'auth'},401);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.license&&!licenseState(ctx.license).writable)return reply({error:'licenseReadOnly'},403);const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>1_600_000)return reply({error:'limit'},413);
 const body=JSON.parse(raw) as{revision:number;requestId:string;operation:Operation};if(!body||!Number.isSafeInteger(body.revision)||typeof body.requestId!=='string'||!/^[-a-zA-Z0-9]{16,80}$/.test(body.requestId)||!body.operation||typeof body.operation.type!=='string')return reply({error:'invalid'},400);
 if(ctx.branches&&!ctx.branches.includes(body.operation.branch))return reply({error:'forbidden'},403);
 if(ctx.role==='reception'&&!['visit.add','visit.scan','visit.exit','class.book','member.register','plan.assign','payment.add'].includes(body.operation.type))return reply({error:'forbidden'},403);
 const current=await readSpace(ctx.owner);
 if(!permitted(ctx.role,body.operation.type,attendanceGranted(current.state.attendanceGrants,ctx.user.userId,body.operation.branch),attendanceGranted(current.state.bookingGrants,ctx.user.userId,body.operation.branch),attendanceGranted(current.state.salesGrants,ctx.user.userId,body.operation.branch),attendanceGranted(current.state.collectionGrants,ctx.user.userId,body.operation.branch))||(ctx.branches&&!ctx.branches.includes(body.operation.branch)))return reply({error:'forbidden'},403);
 if(ctx.role==='reception'&&body.operation.type==='plan.assign'&&(body.operation.startMode==='replaceCurrent'||(body.operation.paid!==0&&!attendanceGranted(current.state.collectionGrants,ctx.user.userId,body.operation.branch))))return reply({error:'forbidden'},403);
 if(['legacy.import','settings.save','logo.set','branch.add','demo.seed','demo.clear'].includes(body.operation.type)&&!(await administrator(ctx)))return reply({error:'forbidden'},403);
 const digest=await hash(JSON.stringify(body.operation)),receipt=current.state.receipts.find(r=>r.id===ctx.user.userId+':'+body.requestId);
 if(receipt){if(receipt.digest!==digest)return reply({error:'replay'},409);return reply(packet(current,ctx));}if(body.revision!==current.revision)return reply({error:'conflict'},409);
 const state=applyOperation(current.state,body.operation,new Date().toISOString(),ctx.user.displayName,()=>crypto.randomUUID());state.receipts.push({id:ctx.user.userId+':'+body.requestId,digest});if(state.receipts.length>1000)state.receipts.shift();const payload=JSON.stringify(state);if(new TextEncoder().encode(payload).byteLength>20_000_000)return reply({error:'limit'},413);
 if(!await persistSpace(ctx.owner,current,state))return reply({error:'conflict'},409);return reply(packet({state,revision:current.revision+1},ctx));
 }catch(e){if(e instanceof CommercialError)return reply({error:e.code},e.status);if(e instanceof RuleError)return reply({error:e.code},400);if(e instanceof SyntaxError||e instanceof RangeError)return reply({error:'invalid'},400);return reply({error:e instanceof Error&&e.message==='forbidden'?'forbidden':'unavailable'},e instanceof Error&&e.message==='forbidden'?403:503);}}
