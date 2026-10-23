import {randomBytes} from 'node:crypto';
import {codeMemberIdentity} from '../../lib/member-code-session';
import {memberCodeHash,memberCookie,memberSessionToken} from '../../lib/member-code';
import {normalizeMemberPin} from '../../lib/member-phone';
import {withScope} from '../../lib/database';
import {reply,sameOrigin} from '../../lib/server-workspace';
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'origin'},403);
 if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
 try{const raw=await request.text();if(raw.length>2048)return reply({error:'invalid'},413);const body=JSON.parse(raw),current=normalizeMemberPin(body.currentPin),pin=normalizeMemberPin(body.newPin),confirm=normalizeMemberPin(body.confirmPin);
  if(!current||!pin||pin!==confirm||pin==='123456'||pin===current)return reply({error:'invalidPin'},400);
  const identity=await codeMemberIdentity(request),oldToken=memberSessionToken(request);if(!identity||!oldToken)return reply({error:'auth'},401);
  const token=randomBytes(32).toString('hex');const status=await withScope(identity.owner_id,async c=>{
   const bucket=memberCodeHash('pin-change:'+oldToken);await c.query("SELECT set_config('app.member_attempt',$1,true)",[bucket]);const attempts=Number((await c.query("INSERT INTO gymos.member_code_attempts(bucket) VALUES($1) ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN member_code_attempts.started_at<now()-interval '15 minutes' THEN 1 ELSE member_code_attempts.attempts+1 END,started_at=CASE WHEN member_code_attempts.started_at<now()-interval '15 minutes' THEN now() ELSE member_code_attempts.started_at END RETURNING attempts",[bucket])).rows[0].attempts);if(attempts>5)return 429;
   const row=(await c.query('SELECT version,gymos.member_pin_matches($3,pin_hash) AS matches FROM gymos.member_code_access WHERE owner_id=$1 AND member_id=$2 AND NOT revoked AND NOT inactive FOR UPDATE',[identity.owner_id,identity.member_id,current])).rows[0];if(!row||!row.matches||row.version!==identity.version)return 401;
   await c.query('UPDATE gymos.member_code_access SET pin_hash=gymos.member_pin_hash($3),pin_cipher=NULL,pin_must_change=false,version=version+1 WHERE owner_id=$1 AND member_id=$2',[identity.owner_id,identity.member_id,pin]);
   await c.query('DELETE FROM gymos.member_code_sessions WHERE owner_id=$1 AND member_id=$2',[identity.owner_id,identity.member_id]);
   await c.query("INSERT INTO gymos.member_code_sessions(session_hash,owner_id,member_id,version,expires_at) VALUES($1,$2,$3,$4,now()+interval '7 days')",[memberCodeHash(token),identity.owner_id,identity.member_id,row.version+1]);return 200;
  });if(status!==200){const r=reply({error:status===429?'rateLimit':'invalidCredentials'},status);if(status===429)r.headers.set('Retry-After','900');return r;}
  const r=reply({ok:true});r.headers.append('Set-Cookie',`${memberCookie}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7*86400}`);return r;
 }catch{return reply({error:'unavailable'},503);}
}
