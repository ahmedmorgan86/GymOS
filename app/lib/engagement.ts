import {z} from 'zod';
import {dayAt,days,RuleError,type GymState,type Operation} from './domain.ts';
import {membershipPeriods} from './membership-periods.ts';
import {normalizeMemberPhone} from './member-phone-format.ts';

const id=z.string().trim().min(1).max(250), stamp=z.string().datetime({offset:true});
const consent=z.object({member:id,branch:id,enabled:z.boolean(),at:stamp,actor:id}).strict();
const message=z.object({id,member:id,branch:id,occurrence:id,to:z.string().regex(/^\+[1-9]\d{7,14}$/),text:z.string().min(1).max(480),dispatchAt:stamp.optional(),providerId:z.string().regex(/^SM[a-fA-F0-9]{32}$/).optional(),status:z.enum(['draft','approved','cancelled','dispatching','submitted','uncertain']),at:stamp,actor:id}).strict();
const ticket=z.object({id,branch:id,subject:z.string().trim().min(1).max(150),status:z.enum(['open','closed']),priority:z.enum(['normal','urgent']),messages:z.array(z.object({text:z.string().trim().min(1).max(2000),actor:id,at:stamp}).strict()).min(1).max(100),at:stamp}).strict();
const device=z.object({id,branch:id,name:z.string().trim().min(1).max(100),enabled:z.boolean(),mappings:z.array(z.object({person:id,member:id}).strict()).max(10000)}).strict();
export const engagementSchema=z.object({consents:z.array(consent).max(10000),sms:z.array(message).max(10000),tickets:z.array(ticket).max(1000),devices:z.array(device).max(100),deviceEvents:z.array(z.object({id,device:id,branch:id,digest:z.string().length(64),at:stamp}).strict()).max(10000)}).strict();
export type Engagement=z.infer<typeof engagementSchema>;
export const emptyEngagement=():Engagement=>({consents:[],sms:[],tickets:[],devices:[],deviceEvents:[]});
/** A historical backup must not resurrect consent, an enabled device or a sendable message. */
export function preserveEngagementSecurity(current:GymState,next:GymState){
 const old=current.engagement??emptyEngagement(),e=next.engagement??=emptyEngagement();
 const branch=(b:string)=>next.branches.some(x=>x.id===b),member=(m:string,b:string)=>next.members.some(x=>x.id===m&&x.branch===b);
 e.consents=structuredClone(old.consents.filter(x=>member(x.member,x.branch)));
 e.sms=structuredClone(old.sms.filter(x=>member(x.member,x.branch)));
 e.devices=structuredClone(old.devices.filter(x=>branch(x.branch))).map(d=>({...d,mappings:d.mappings.filter(m=>member(m.member,d.branch))}));
 e.deviceEvents=structuredClone(old.deviceEvents.filter(x=>e.devices.some(d=>d.id===x.device&&d.branch===x.branch)));
}
export function validateEngagement(s:GymState){
 const e=s.engagement;if(!e)return;
 engagementSchema.parse(e);
 const member=(m:string,b:string)=>s.members.some(x=>x.id===m&&x.branch===b);
 for(const rows of [e.consents,e.sms,e.tickets,e.devices,e.deviceEvents])for(const x of rows)if(!s.branches.some(b=>b.id===x.branch))throw Error('engagement branch');
 for(const x of [...e.consents,...e.sms])if(!member(x.member,x.branch))throw Error('engagement member');
 for(const rows of [e.sms,e.tickets,e.devices,e.deviceEvents])if(new Set(rows.map(x=>x.id)).size!==rows.length)throw Error('engagement duplicate');
 if(new Set(e.consents.map(x=>x.member)).size!==e.consents.length)throw Error('consent duplicate');
 for(const d of e.devices){if(new Set(d.mappings.map(x=>x.person)).size!==d.mappings.length)throw Error('device mapping duplicate');for(const m of d.mappings)if(!member(m.member,d.branch))throw Error('device mapping member');}
 for(const x of e.deviceEvents)if(!e.devices.some(d=>d.id===x.device&&d.branch===x.branch))throw Error('device event reference');
}
/** Explainable proposals only: no renewal sale, charge or external message is executed. */
export function renewalCandidates(s:GymState,branch:string,now:string,offset=7){
 const today=dayAt(now,s.settings.timezone);
 return s.members.filter(m=>m.branch===branch&&!m.demo&&!m.archived&&!m.awaitingSubscription).flatMap(m=>{
  const terms=membershipPeriods(m).filter(p=>!p.cancelled),end=terms.reduce((end,p)=>p.end>end?p.end:end,m.expires);
  const remaining=days(today,end);if(remaining< -7||remaining>offset||m.freezes?.some(f=>!f.cancelled&&f.from<=today&&f.to>=today))return[];
  return[{member:m.id,end,remaining,reason:remaining<0?'expired':'renewal',occurrence:m.id+'|'+end}];
 });
}
export function engagementOperation(s:GymState,op:Operation,now:string,actor:string,newId:()=>string){
 if(!op.type.startsWith('engagement.'))return false;
 const e=s.engagement??=emptyEngagement();
 const member=()=>{const m=s.members.find(m=>m.id===op.member&&m.branch===op.branch&&!m.demo&&!m.archived);if(!m)throw new RuleError('notFound');return m;};
 switch(op.type){
  case'engagement.consent':{const m=member();const row=consent.parse({member:m.id,branch:op.branch,enabled:op.enabled,at:now,actor});e.consents=e.consents.filter(c=>c.member!==m.id);e.consents.push(row);if(!row.enabled)for(const x of e.sms)if(x.member===m.id&&['draft','approved'].includes(x.status))x.status='cancelled';break;}
  case'engagement.sms.prepare':{
   const m=member(),candidate=renewalCandidates(s,op.branch,now).find(c=>c.member===m.id);
   if(!candidate||!e.consents.some(c=>c.member===m.id&&c.enabled))throw new RuleError('approval');
   const to=normalizeMemberPhone(m.phone);if(!to)throw new RuleError('invalid');
   if(e.sms.some(x=>x.member===m.id&&x.occurrence===candidate.occurrence))throw new RuleError('replay');
   e.sms.push(message.parse({id:newId(),member:m.id,branch:op.branch,occurrence:candidate.occurrence,to,text:op.language==='en'?`${s.settings.name}: your membership ends on ${candidate.end}. Please contact reception to renew.`:`${s.settings.name}: تنتهي عضويتك بتاريخ ${candidate.end}. تواصل مع الاستقبال للتجديد.`,status:'draft',at:now,actor}));break;
  }
  case'engagement.sms.approve':case'engagement.sms.cancel':{const x=e.sms.find(x=>x.id===op.id&&x.branch===op.branch);if(!x||!['draft','approved'].includes(x.status))throw new RuleError('transition');const m=s.members.find(m=>m.id===x.member&&!m.archived&&!m.demo&&m.branch===op.branch);if(op.type.endsWith('approve')&&(!m||normalizeMemberPhone(m.phone)!==x.to||!e.consents.some(c=>c.member===x.member&&c.enabled)))throw new RuleError('approval');x.status=op.type.endsWith('approve')?'approved':'cancelled';break;}
  case'engagement.ticket.create':e.tickets.push(ticket.parse({id:newId(),branch:op.branch,subject:op.subject,priority:op.priority??'normal',status:'open',messages:[{text:op.text,actor,at:now}],at:now}));break;
  case'engagement.ticket.reply':{const t=e.tickets.find(t=>t.id===op.id&&t.branch===op.branch&&t.status==='open');if(!t||t.messages.length>=100)throw new RuleError('transition');t.messages.push(z.object({text:z.string().trim().min(1).max(2000),actor:id,at:stamp}).strict().parse({text:op.text,actor,at:now}));break;}
  case'engagement.ticket.close':{const t=e.tickets.find(t=>t.id===op.id&&t.branch===op.branch);if(!t||t.status!=='open')throw new RuleError('transition');t.status='closed';break;}
  case'engagement.device.save':{const previous=e.devices.find(d=>d.id===op.id&&d.branch===op.branch);if(op.id&&!previous)throw new RuleError('notFound');const row=device.parse({id:previous?.id??newId(),branch:op.branch,name:op.name,enabled:op.enabled,mappings:op.mappings});if(previous)Object.assign(previous,row);else e.devices.push(row);break;}
  default:throw new RuleError('invalid');
 }
 validateEngagement(s);return true;
}
