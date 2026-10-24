export type LicenseMode='trial'|'monthly'|'annual'|'perpetual';
export type Limits={branches:number;members:number;staff:number};
export type License={tenant_id:string;plan_id:string;mode:LicenseMode;status:'pending'|'active'|'suspended';starts_at:string|null;ends_at:string|null;maintenance_until:string|null;limits:Limits;revision:number};
export class CommercialError extends Error{code:string;status:number;constructor(code:string,status=400){super(code);this.code=code;this.status=status;}}
export function limits(value:unknown):Limits{const v=value as Limits;if(!v||!Number.isSafeInteger(v.branches)||v.branches<1||v.branches>10000||!Number.isSafeInteger(v.members)||v.members<1||v.members>1000000||!Number.isSafeInteger(v.staff)||v.staff<1||v.staff>100000)throw new CommercialError('limits');return{branches:v.branches,members:v.members,staff:v.staff};}
export function licenseState(license:License,now=Date.now()){
 const started=Boolean(license.starts_at)&&Date.parse(license.starts_at!)<=now;
 const expired=license.mode!=='perpetual'&&(!license.ends_at||!Number.isFinite(Date.parse(license.ends_at))||Date.parse(license.ends_at)<=now);
 const writable=license.status==='active'&&started&&!expired;
 return{writable,state:license.status!=='active'?license.status:!started?'scheduled':expired?'expired':'active',maintenance:license.maintenance_until!==null&&Date.parse(license.maintenance_until)>now};
}
export function plusMonths(iso:string,months:number){const d=new Date(iso);if(!Number.isFinite(d.getTime())||!Number.isSafeInteger(months)||months<1||months>120)throw new CommercialError('date');const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+months);const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));return d.toISOString();}
export function licenseGrant(current:License,mode:'monthly'|'annual'|'perpetual'|'maintenance'|'trial',now:string){
 const stamp=Date.parse(now);if(!Number.isFinite(stamp))throw new CommercialError('date');
 if(mode==='maintenance'){if(current.mode!=='perpetual')throw new CommercialError('maintenanceRequiresPerpetual');const start=current.maintenance_until&&Date.parse(current.maintenance_until)>stamp?current.maintenance_until:now;return{mode:current.mode,starts_at:current.starts_at??now,ends_at:null,maintenance_until:plusMonths(start,12)};}
 const paidCalendarTerm=current.mode===mode&&(mode==='monthly'||mode==='annual')&&(current.status==='active'||current.status==='suspended')&&Boolean(current.starts_at)&&Number.isFinite(Date.parse(current.starts_at!))&&Boolean(current.ends_at)&&Number.isFinite(Date.parse(current.ends_at!))&&Date.parse(current.ends_at!)>stamp&&Date.parse(current.ends_at!)>Date.parse(current.starts_at!);
 const continuing=paidCalendarTerm||(current.mode===mode&&licenseState(current,stamp).writable);
 const start=continuing&&current.ends_at&&Date.parse(current.ends_at)>stamp?current.ends_at:now;
 return{mode,starts_at:continuing?current.starts_at:now,ends_at:mode==='perpetual'?null:mode==='trial'?new Date(Date.parse(now)+30*86400000).toISOString():plusMonths(start,mode==='monthly'?1:12),maintenance_until:mode==='perpetual'?plusMonths(now,12):null};
}
export function assertGrowth(cap:Limits,before:{branches:number;members:number},after:{branches:number;members:number}){for(const field of ['branches','members'] as const)if(after[field]>cap[field]&&after[field]>before[field])throw new CommercialError(field==='branches'?'branchLimit':'memberLimit',403);}
export function priceMinor(value:unknown,optional=false){if(optional&&(value===null||value===''))return null;const amount=typeof value==='string'?Number(value):value;if(!Number.isSafeInteger(amount)||Number(amount)<0||Number(amount)>100000000000)throw new CommercialError('amount');return Number(amount);}

export function trialClosed(license:License|null|undefined,now=Date.now()){return license?.mode==='trial'&&!licenseState(license,now).writable;}

/** A reported bank-transfer day must be a real calendar day no later than Cairo today. */
export function transferDay(value:unknown,now=new Date().toISOString()){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value)||!Number.isFinite(Date.parse(value+'T12:00:00Z'))||new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value||!Number.isFinite(Date.parse(now)))throw new CommercialError('date');
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Cairo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 if(value>today)throw new CommercialError('date');return value;
}
