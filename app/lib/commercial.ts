import 'server-only';
import type {CommercialClub} from './commercial-types';
import {randomUUID} from 'node:crypto';
import type {PoolClient} from 'pg';
import {getPool} from './database';
import {CommercialError,licenseGrant,limits,priceMinor,type License} from './licensing';
import type {ChatGPTUser} from '../chatgpt-auth';
import {emptyState} from './domain';
export const commercialEnabled=()=>process.env.GYMOS_COMMERCIAL==='1';
export function normalizeLicense(row:License):License{for(const field of ['starts_at','ends_at','maintenance_until'] as const){const value=row[field] as unknown;if(value instanceof Date)row[field]=value.toISOString();}return row;}
export type Club={id:string;storage_key:string;name:string;role:'owner'|'manager'|'reception';branches:string[]|null};
export async function commercialTransaction<T>(user:ChatGPTUser,work:(client:PoolClient,platform:boolean)=>Promise<T>){
 const client=await getPool().connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.actor',$1,true)",[user.userId]);
 const platform=(await client.query('SELECT user_id FROM gymos.platform_admins WHERE user_id=$1',[user.userId])).rowCount===1;
 if(platform)await client.query("SELECT set_config('app.platform','1',true)");
 const result=await work(client,platform);await client.query('COMMIT');return result;
 }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
export async function selectClub(client:PoolClient,actor:string,id?:string):Promise<Club|null>{
 // Only the actor's membership is visible before selecting a tenant.
 const rows=(await client.query('SELECT tenant_id,role,branches FROM gymos.tenant_memberships WHERE user_id=$1 AND NOT revoked ORDER BY tenant_id',[actor])).rows;
 for(const membership of rows){await client.query("SELECT set_config('app.tenant',$1,true)",[membership.tenant_id]);const row=(await client.query('SELECT id,storage_key,name FROM gymos.tenants WHERE id=$1',[membership.tenant_id])).rows[0];if(row&&(!id||id===row.id||id===row.storage_key))return{...row,role:membership.role,branches:membership.branches};}
 return null;
}
export async function commercialContext(user:ChatGPTUser,id?:string){return commercialTransaction(user,async client=>{const club=await selectClub(client,user.userId,id);if(!club)throw new CommercialError('chooseClub',409);const license=normalizeLicense((await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1',[club.id])).rows[0] as License);return{...club,license};});}
async function audit(client:PoolClient,user:ChatGPTUser,tenant:string|null,action:string,details:unknown={}){await client.query('INSERT INTO gymos.commercial_audit(id,actor,tenant_id,action,details) VALUES($1,$2,$3,$4,$5)',[randomUUID(),user.userId,tenant,action,JSON.stringify(details)]);}
function text(value:unknown,max=120){if(typeof value!=='string'||!value.trim()||value.trim().length>max)throw new CommercialError('invalid');return value.trim();}
export async function commercialDirectory(user:ChatGPTUser,platformView=false){return commercialTransaction(user,async(client,platform)=>{
 if(platformView&&!platform)throw new CommercialError('forbidden',403);
 let clubs:CommercialClub[]=[];
 if(platformView)clubs=(await client.query('SELECT t.id,t.name,t.created_at,l.* FROM gymos.tenants t JOIN gymos.tenant_licenses l ON l.tenant_id=t.id ORDER BY t.created_at DESC LIMIT 500')).rows;
 else{const memberships=(await client.query('SELECT tenant_id FROM gymos.tenant_memberships WHERE user_id=$1 AND NOT revoked ORDER BY tenant_id',[user.userId])).rows;for(const m of memberships){const club=await selectClub(client,user.userId,m.tenant_id);if(club){const license=(await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1',[club.id])).rows[0];const requests=club.role==='owner'?(await client.query('SELECT * FROM gymos.activation_requests WHERE tenant_id=$1 ORDER BY created_at DESC LIMIT 30',[club.id])).rows:[];const members=club.role==='owner'?(await client.query('SELECT user_id,name,role FROM gymos.tenant_memberships WHERE tenant_id=$1 AND NOT revoked ORDER BY role,name',[club.id])).rows:[];clubs.push({id:club.id,name:club.name,role:club.role,license,requests,members});}}}
 const plans=platformView?(await client.query('SELECT * FROM gymos.commercial_plans ORDER BY id')).rows:[];
 const settings=(await client.query('SELECT payload,revision FROM gymos.platform_settings WHERE id=1')).rows[0];
 const orders=platformView?(await client.query('SELECT r.*,t.name AS club_name FROM gymos.activation_requests r JOIN gymos.tenants t ON t.id=r.tenant_id ORDER BY r.created_at DESC LIMIT 200')).rows:[];
 const events=platformView?(await client.query('SELECT * FROM gymos.commercial_audit ORDER BY at DESC LIMIT 100')).rows:[];
 const trialUsed=(await client.query('SELECT owner_id FROM gymos.trial_claims WHERE owner_id=$1',[user.userId])).rowCount!==0;return{platform,clubs,plans,settings,orders,events,trialUsed};
 });}
export async function commercialAction(user:ChatGPTUser,body:Record<string,unknown>){return commercialTransaction(user,(client,platform)=>commercialWork(client,platform,user,body));}
export async function commercialWork(client:PoolClient,platform:boolean,user:ChatGPTUser,body:Record<string,unknown>){
 const action=body.action;
 if(action==='create'){
  // Limit repeated self-service registrations, including pending clubs.
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[user.userId]);
  const count=Number((await client.query("SELECT count(*) FROM gymos.tenant_memberships WHERE user_id=$1 AND role='owner' AND NOT revoked",[user.userId])).rows[0].count);if(count>=20)throw new CommercialError('clubLimit',403);
  const id=randomUUID(),name=text(body.name),key='tenant:'+id;await client.query("SELECT set_config('app.tenant',$1,true)",[id]);
  await client.query('INSERT INTO gymos.tenants(id,storage_key,name,created_by) VALUES($1,$2,$3,$4)',[id,key,name,user.userId]);
  await client.query("INSERT INTO gymos.tenant_memberships(tenant_id,user_id,role,name) VALUES($1,$2,'owner',$3)",[id,user.userId,user.displayName]);
  await client.query("INSERT INTO gymos.tenant_licenses(tenant_id,plan_id,mode,status,limits) SELECT $1,id,'monthly','pending',limits FROM gymos.commercial_plans WHERE id='custom' AND published",[id]);
  await client.query("SELECT set_config('app.gym_owner',$1,true)",[key]);const state=emptyState();state.settings.name=name;await client.query('INSERT INTO gymos.gym_states(user_id,payload,revision,updated_at) VALUES($1,$2,0,$3)',[key,JSON.stringify(state),new Date().toISOString()]);await audit(client,user,id,'club.created');return{id};
 }
 if(['settings','plan','quote','approve','reject','suspend','resume'].includes(String(action))){
  if(!platform)throw new CommercialError('forbidden',403);
  if(action==='settings'){const payload={company:text(body.company),support:String(body.support??'').slice(0,300),paymentInstructions:String(body.paymentInstructions??'').slice(0,4000),terms:String(body.terms??'').slice(0,8000),privacy:String(body.privacy??'').slice(0,8000)};const changed=await client.query('UPDATE gymos.platform_settings SET payload=$1,revision=revision+1 WHERE id=1 AND revision=$2',[JSON.stringify(payload),body.revision]);if(!changed.rowCount)throw new CommercialError('conflict',409);await audit(client,user,null,'settings.updated');return{ok:true};}
  if(action==='plan'){const id=text(body.id,50);if(!/^[a-z0-9-]+$/.test(id)||id==='legacy')throw new CommercialError('invalid');const cap=limits(body.limits);if(cap.branches>100||cap.members>10000)throw new CommercialError('limits');const name=text(body.name,100),currency=text(body.currency,3).toUpperCase();if(!/^[A-Z]{3}$/.test(currency))throw new CommercialError('invalid');const prices=['monthly','annual','perpetual','maintenance'].map(mode=>priceMinor(body[mode],true));
   const result=await client.query('INSERT INTO gymos.commercial_plans(id,name,currency,monthly_minor,annual_minor,perpetual_minor,maintenance_minor,limits,published) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(id) DO UPDATE SET name=excluded.name,currency=excluded.currency,monthly_minor=excluded.monthly_minor,annual_minor=excluded.annual_minor,perpetual_minor=excluded.perpetual_minor,maintenance_minor=excluded.maintenance_minor,limits=excluded.limits,published=excluded.published,revision=gymos.commercial_plans.revision+1 WHERE gymos.commercial_plans.revision=$10 RETURNING id',[id,name,currency,...prices,JSON.stringify(cap),body.published===true,body.revision??0]);if(!result.rowCount)throw new CommercialError('conflict',409);await audit(client,user,null,'plan.saved',{id});return{ok:true};}
  if(action==='suspend'||action==='resume'){const id=text(body.tenant);await client.query('SELECT id FROM gymos.tenants WHERE id=$1 FOR UPDATE',[id]);const result=await client.query("UPDATE gymos.tenant_licenses SET status=$1,revision=revision+1,updated_at=now() WHERE tenant_id=$2 AND revision=$3",[action==='suspend'?'suspended':'active',id,body.revision]);if(!result.rowCount)throw new CommercialError('conflict',409);await audit(client,user,id,'license.'+action,{note:text(body.note,1000)});return{ok:true};}
  const order=(await client.query('SELECT * FROM gymos.activation_requests WHERE id=$1 FOR UPDATE',[text(body.id)])).rows[0];if(!order)throw new CommercialError('notFound',404);
  if(action==='quote'){if(order.status!=='quote_requested')throw new CommercialError('conflict',409);await client.query("UPDATE gymos.activation_requests SET expected_minor=$1,status='awaiting_payment',review_note=$2 WHERE id=$3",[(()=>{const amount=priceMinor(body.amount);if(amount===null||amount<=0)throw new CommercialError('amount');return amount;})(),text(body.note,1000),order.id]);await audit(client,user,order.tenant_id,'order.quoted',{id:order.id});return{ok:true};}
  if(order.status!=='pending_review')throw new CommercialError('conflict',409);
  const review=text(body.note,1000),note=[order.review_note,review].filter(Boolean).join('\n\n');
  if(action==='approve'){
   const reference=String(order.transfer_ref??'').normalize('NFKC').replace(/\s+/g,'').toUpperCase();if(!reference)throw new CommercialError('paymentMismatch',409);
   await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',['gymos-transfer:'+order.currency+':'+reference]);
   if((await client.query("SELECT id FROM gymos.activation_requests WHERE status='approved' AND currency=$1 AND upper(regexp_replace(transfer_ref,'[[:space:]]','','g'))=$2 AND id<>$3 LIMIT 1",[order.currency,reference,order.id])).rowCount)throw new CommercialError('paymentAlreadyUsed',409);
   await client.query('SELECT id FROM gymos.tenants WHERE id=$1 FOR UPDATE',[order.tenant_id]);
   if(body.confirm!=='VERIFIED_TRANSFER'||order.expected_minor===null||order.paid_minor===null||BigInt(order.expected_minor)!==BigInt(order.paid_minor))throw new CommercialError('paymentMismatch',409);
   const current=normalizeLicense((await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1 FOR UPDATE',[order.tenant_id])).rows[0] as License);
   const plan=(await client.query('SELECT * FROM gymos.commercial_plans WHERE id=$1',[order.plan_id])).rows[0];const grant=licenseGrant(current,order.mode,new Date().toISOString());
   await client.query("UPDATE gymos.tenant_licenses SET plan_id=$1,mode=$2,status='active',starts_at=$3,ends_at=$4,maintenance_until=$5,limits=$6,revision=revision+1,updated_at=now() WHERE tenant_id=$7",[order.mode==='maintenance'?current.plan_id:plan.id,grant.mode,grant.starts_at,grant.ends_at,grant.maintenance_until,JSON.stringify(order.mode==='maintenance'?current.limits:limits(order.entitlements)),order.tenant_id]);
  }
  await client.query('UPDATE gymos.activation_requests SET status=$1,review_note=$2,reviewed_at=now(),reviewed_by=$3 WHERE id=$4',[action==='approve'?'approved':'rejected',note,user.userId,order.id]);await audit(client,user,order.tenant_id,'order.'+action,{id:order.id});return{ok:true};
 }
 const club=await selectClub(client,user.userId,text(body.tenant));if(!club)throw new CommercialError('forbidden',403);
 if(action==='select')return{id:club.id};
 if(club.role!=='owner')throw new CommercialError('forbidden',403);
 if(action==='trial.start'){try{const result=await client.query('SELECT gymos.start_public_trial($1) AS trial',[club.id]);return{ok:true,...result.rows[0].trial};}catch(e){const message=e instanceof Error?e.message:'';if(message.includes('trial_used'))throw new CommercialError('trialUsed',409);if(message.includes('trial_unavailable'))throw new CommercialError('trialUnavailable',409);throw e;}}
 if(action==='owner.add'||action==='owner.remove'){
  if(body.confirm!=='CHANGE_OWNERSHIP')throw new CommercialError('confirmation');
  await client.query('SELECT id FROM gymos.tenants WHERE id=$1 FOR UPDATE',[club.id]);
  const target=text(body.user),membership=(await client.query('SELECT role FROM gymos.tenant_memberships WHERE tenant_id=$1 AND user_id=$2 AND NOT revoked FOR UPDATE',[club.id,target])).rows[0];if(!membership)throw new CommercialError('notFound',404);
  if(action==='owner.add'){if(membership.role==='owner')throw new CommercialError('conflict',409);await client.query("UPDATE gymos.tenant_memberships SET role='owner',branches=NULL WHERE tenant_id=$1 AND user_id=$2",[club.id,target]);}
  else{if(membership.role!=='owner')throw new CommercialError('invalid');const owners=Number((await client.query("SELECT count(*) FROM gymos.tenant_memberships WHERE tenant_id=$1 AND role='owner' AND NOT revoked",[club.id])).rows[0].count);if(owners<=1)throw new CommercialError('lastOwner',409);await client.query('UPDATE gymos.tenant_memberships SET revoked=true WHERE tenant_id=$1 AND user_id=$2',[club.id,target]);await client.query("SELECT set_config('app.gym_owner',$1,true)",[club.storage_key]);await client.query('UPDATE gymos.gym_access SET revoked=1 WHERE owner_id=$1 AND user_id=$2',[club.storage_key,target]);}
  await audit(client,user,club.id,action,{user:target});return{ok:true};
 }
 if(action==='order'){
  const mode=body.mode;if(!['monthly','annual','perpetual','maintenance'].includes(String(mode)))throw new CommercialError('invalid');
  const currentAgreement=(await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1',[club.id])).rows[0] as License;const agreementId=currentAgreement.status==='pending'?'custom':currentAgreement.plan_id;const plan=(await client.query('SELECT * FROM gymos.commercial_plans WHERE id=$1',[agreementId])).rows[0];if(!plan)throw new CommercialError('invalid');
  if(mode==='maintenance'){const current=(await client.query('SELECT * FROM gymos.tenant_licenses WHERE tenant_id=$1',[club.id])).rows[0] as License;if(current.mode!=='perpetual'||current.plan_id!==plan.id)throw new CommercialError('maintenanceRequiresPerpetual');}
  const amount=null,id=randomUUID();await client.query('INSERT INTO gymos.activation_requests(id,tenant_id,user_id,plan_id,mode,status,expected_minor,currency,entitlements) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,club.id,user.userId,plan.id,mode,amount===null?'quote_requested':'awaiting_payment',amount,plan.currency,JSON.stringify(limits(currentAgreement.status==='pending'?plan.limits:currentAgreement.limits))]);await audit(client,user,club.id,'order.created',{id});return{ok:true};
 }
 const order=(await client.query('SELECT * FROM gymos.activation_requests WHERE id=$1 AND tenant_id=$2 FOR UPDATE',[text(body.id),club.id])).rows[0];if(!order)throw new CommercialError('notFound',404);
 if(action==='cancel'){if(!['quote_requested','awaiting_payment','pending_review'].includes(order.status))throw new CommercialError('conflict',409);await client.query("UPDATE gymos.activation_requests SET status='cancelled' WHERE id=$1",[order.id]);}
 else if(action==='transfer'){if(order.status!=='awaiting_payment')throw new CommercialError('conflict',409);const day=text(body.day,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day))||day>new Date().toISOString().slice(0,10))throw new CommercialError('date');await client.query("UPDATE gymos.activation_requests SET transfer_ref=$1,transfer_day=$2,paid_minor=$3,note=$4,status='pending_review' WHERE id=$5",[text(body.reference,200).normalize('NFKC').replace(/\s+/g,'').toUpperCase(),day,priceMinor(body.amount),String(body.note??'').slice(0,1000),order.id]);}
 else throw new CommercialError('invalid');
 await audit(client,user,club.id,'order.'+action,{id:order.id});return{ok:true};
 }
