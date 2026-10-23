import {randomBytes} from 'node:crypto';
import {getPool,withScope} from '../../lib/database';
import {readSpace,reply,sameOrigin} from '../../lib/server-workspace';
import {memberCodeHash,memberCookie,memberSessionToken} from '../../lib/member-code';
import {normalizeMemberPhone,normalizeMemberPin} from '../../lib/member-phone';
import {licenseState,type License} from '../../lib/licensing';
import {normalizeLicense} from '../../lib/commercial';
export const dynamic='force-dynamic';
function sessionReply(token:string,maxAge:number){const r=reply({ok:true});r.headers.append('Set-Cookie',`${memberCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`);return r;}
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'origin'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 try{const raw=await request.text();if(raw.length>2048)return reply({error:'invalid'},413);const body=JSON.parse(raw),phone=normalizeMemberPhone(body.phone),pin=normalizeMemberPin(body.pin);if(!phone||!pin||body.account!==undefined&&(typeof body.account!=='string'||body.account.length>600))return reply({error:'invalidCredentials'},400);
  const phoneHash=memberCodeHash(phone),ip=request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'unknown';const c=await getPool().connect();let accounts:{owner_id:string;member_id:string;branch:string;version:number;pin_must_change:boolean;matches:boolean}[];
  try{await c.query('BEGIN');for(const [key,limit]of [[memberCodeHash('phone-ip:'+ip),20],[memberCodeHash('phone:'+phoneHash),5]] as const){await c.query("SELECT set_config('app.member_attempt',$1,true)",[key]);const n=Number((await c.query("INSERT INTO gymos.member_code_attempts(bucket) VALUES($1) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN member_code_attempts.started_at<now()-interval '15 minutes' THEN 1 ELSE member_code_attempts.attempts+1 END,started_at=CASE WHEN member_code_attempts.started_at<now()-interval '15 minutes' THEN now() ELSE member_code_attempts.started_at END RETURNING attempts",[key])).rows[0].attempts);if(n>limit){await c.query('COMMIT');const r=reply({error:'rateLimit'},429);r.headers.set('Retry-After','900');return r;}}
   await c.query("SELECT set_config('app.member_phone',$1,true)",[phoneHash]);const rows=(await c.query('SELECT owner_id,member_id,branch,version,pin_must_change,gymos.member_pin_matches($2,pin_hash) AS matches FROM gymos.member_code_access WHERE phone_hash=$1 AND NOT revoked AND NOT inactive LIMIT 21',[phoneHash,pin])).rows;
   if(!rows.length)await c.query('SELECT gymos.member_pin_matches($1,NULL)',[pin]);accounts=rows.length>20?[]:rows.filter(r=>r.matches);await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
  if(!accounts.length)return reply({error:'invalidCredentials'},401);
  const valid=[];
  for(const account of accounts){const {state}=await readSpace(account.owner_id);if(!state.members.some(m=>m.id===account.member_id&&m.branch===account.branch&&!m.demo&&!m.archived&&normalizeMemberPhone(m.phone)===phone))continue;
   const license=await withScope(account.owner_id,async c=>(await c.query('SELECT l.* FROM gymos.tenant_licenses l JOIN gymos.tenants t ON t.id=l.tenant_id WHERE t.storage_key=$1',[account.owner_id])).rows[0] as License|undefined);if(license&&!licenseState(normalizeLicense(license)).writable)continue;
   valid.push({...account,key:account.owner_id+'|'+account.member_id,label:state.settings.name+' · '+(state.branches.find(b=>b.id===account.branch)?.name??account.branch)});
  }
  if(!valid.length)return reply({error:'invalidCredentials'},401);
  if(valid.length>1&&!body.account)return reply({chooseAccount:valid.map(a=>({id:a.key,name:a.label}))});
  const account=body.account?valid.find(a=>a.key===body.account):valid[0];if(!account)return reply({error:'invalidCredentials'},401);
  const token=randomBytes(32).toString('hex');await withScope(account.owner_id,async c=>{await c.query('DELETE FROM gymos.member_code_sessions WHERE owner_id=$1 AND expires_at<now()',[account.owner_id]);await c.query("INSERT INTO gymos.member_code_sessions(session_hash,owner_id,member_id,version,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')",[memberCodeHash(token),account.owner_id,account.member_id,account.version]);});return sessionReply(token,7*86400);
 }catch{return reply({error:'unavailable'},503);}
}
export async function DELETE(request:Request){if(!sameOrigin(request))return reply({error:'origin'},403);try{const token=memberSessionToken(request);if(token){const c=await getPool().connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.member_session',$1,true)",[memberCodeHash(token)]);await c.query('DELETE FROM gymos.member_code_sessions WHERE session_hash=$1',[memberCodeHash(token)]);await c.query('COMMIT');}catch{await c.query('ROLLBACK');return reply({error:'unavailable'},503);}finally{c.release();}}return sessionReply('',0);}catch{return reply({error:'unavailable'},503);}}
