import {dayAt} from '../../lib/domain';
import {context,readSpace,reply,sameOrigin} from '../../lib/server-workspace';
import {assertRequestTenant} from '../../lib/request-tenant';
import {licenseState} from '../../lib/licensing';
import {persistSpace} from '../../lib/entity-store';
import {renewalCandidates} from '../../lib/engagement';
import {normalizeMemberPhone} from '../../lib/member-phone';
import {smsConnection,submitSms} from '../../lib/sms-provider';
export async function POST(request:Request){
 try{
  if(!sameOrigin(request))return reply({error:'origin'},403);
  const ctx=await context();if(!ctx||!['owner','manager'].includes(ctx.role))return reply({error:'forbidden'},403);
  assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));if(ctx.license&&!licenseState(ctx.license).writable)return reply({error:'licenseReadOnly'},403);
  if(process.env.GYMOS_SMS_ENABLED!=='1')return reply({error:'notConfigured'},503);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
  const raw=await request.text();if(raw.length>2048)return reply({error:'limit'},413);
  const body=JSON.parse(raw);if(typeof body.id!=='string'||body.id.length>250||!Number.isSafeInteger(body.revision))return reply({error:'invalid'},400);
  const current=await readSpace(ctx.owner);if(current.revision!==body.revision)return reply({error:'conflict'},409);
  const next=structuredClone(current.state);const row=next.engagement?.sms.find(x=>x.id===body.id);if(!row||ctx.branches&&!ctx.branches.includes(row.branch))return reply({error:'forbidden'},403);
  if(row.status!=='approved')return reply({error:'transition'},409);
  const m=current.state.members.find(m=>m.id===row.member&&m.branch===row.branch&&!m.archived&&!m.demo);
  if(!m||normalizeMemberPhone(m.phone)!==row.to||!current.state.engagement!.consents.some(c=>c.member===m.id&&c.enabled)||!renewalCandidates(current.state,row.branch,new Date().toISOString()).some(c=>c.occurrence===row.occurrence))return reply({error:'approval'},403);
  const config=smsConnection(ctx.owner,row.branch,process.env.GYMOS_SMS_CONNECTIONS??'[]');
  const now=new Date().toISOString(),today=dayAt(now,next.settings.timezone);if(next.engagement!.sms.filter(x=>x.branch===row.branch&&x.dispatchAt&&dayAt(x.dispatchAt,next.settings.timezone)===today).length>=config.dailyLimit)return reply({error:'dailyLimit'},429);
  row.dispatchAt=now;row.status='dispatching';next.events.push({id:crypto.randomUUID(),branch:row.branch,at:new Date().toISOString(),kind:'sms.dispatch',subject:row.id,actor:ctx.user.userId});
  if(!await persistSpace(ctx.owner,current,next))return reply({error:'conflict'},409);
  let result:{providerId:string;status:'submitted'}|undefined;
  try{result=await submitSms(config,row.to,row.text);}catch{/* Unknown outcome: never retry automatically. */}
  for(let attempt=0;attempt<3;attempt++){
   const latest=await readSpace(ctx.owner),after=structuredClone(latest.state),saved=after.engagement?.sms.find(x=>x.id===row.id);
   if(!saved||saved.status!=='dispatching')break;
   saved.status=result?'submitted':'uncertain';if(result)saved.providerId=result.providerId;
   if(await persistSpace(ctx.owner,latest,after))return reply({ok:Boolean(result),status:saved.status},result?200:502);
  }
  return reply({error:'reconciliationRequired',status:'dispatching'},503);
 }catch{return reply({error:'unavailable'},503);}
}
