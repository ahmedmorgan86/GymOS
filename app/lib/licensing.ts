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
 if(mode==='maintenance'){if(current.mode!=='perpetual')throw new CommercialError('maintenanceRequiresPerpetual');const start=current.maintenance_until&&current.maintenance_until>now?current.maintenance_until:now;return{mode:current.mode,starts_at:current.starts_at??now,ends_at:null,maintenance_until:plusMonths(start,12)};}
 const continuing=current.mode===mode&&licenseState(current,Date.parse(now)).writable;
 const start=continuing&&current.ends_at&&current.ends_at>now?current.ends_at:now;
 return{mode,starts_at:continuing?current.starts_at:now,ends_at:mode==='perpetual'?null:mode==='trial'?new Date(Date.parse(now)+30*86400000).toISOString():plusMonths(start,mode==='monthly'?1:12),maintenance_until:mode==='perpetual'?plusMonths(now,12):null};
}
export function assertGrowth(cap:Limits,before:{branches:number;members:number},after:{branches:number;members:number}){for(const field of ['branches','members'] as const)if(after[field]>cap[field]&&after[field]>before[field])throw new CommercialError(field==='branches'?'branchLimit':'memberLimit',403);}
export function priceMinor(value:unknown,optional=false){if(optional&&(value===null||value===''))return null;const amount=typeof value==='string'?Number(value):value;if(!Number.isSafeInteger(amount)||Number(amount)<0||Number(amount)>100000000000)throw new CommercialError('amount');return Number(amount);}

export function trialClosed(license:License|null|undefined,now=Date.now()){return license?.mode==='trial'&&!licenseState(license,now).writable;}
