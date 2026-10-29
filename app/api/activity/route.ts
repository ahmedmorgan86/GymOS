import {CommercialError} from '../../lib/licensing';
import {context,reply,readSpace} from '../../lib/server-workspace';
import {assertRequestTenant} from '../../lib/request-tenant';
import {getPool} from '../../lib/database';
import {activityPage} from '../../lib/activity-history';
export const dynamic='force-dynamic';
export async function GET(request:Request){let c;try{const ctx=await context();if(!ctx)return reply({error:'auth'},401);assertRequestTenant(request,ctx.tenantId,Boolean(ctx.license));const url=new URL(request.url),branch=url.searchParams.get('branch');if(ctx.role==='reception'||!branch||(ctx.branches&&!ctx.branches.includes(branch)))return reply({error:'forbidden'},403);
 const at=url.searchParams.get('at'),id=url.searchParams.get('id');if((at&&!id)||(!at&&id)||(at&&at.length>50)||(id&&id.length>250))return reply({error:'invalid'},400);
 c=await getPool().connect();await c.query('BEGIN');await c.query("SELECT set_config('app.gym_owner',$1,true)",[ctx.owner]);const result=await c.query(`SELECT payload FROM (
 SELECT at,event_id,payload FROM gymos.gym_activity_archive WHERE owner_id=$1 AND branch=$2
 UNION ALL SELECT payload->>'at',entity_id,payload FROM gymos.gym_entities e WHERE owner_id=$1 AND branch=$2 AND collection='events' AND NOT EXISTS(SELECT 1 FROM gymos.gym_activity_archive a WHERE a.owner_id=e.owner_id AND a.event_id=e.entity_id)
 ) history WHERE ($3::text IS NULL OR (at,event_id)<($3,$4)) ORDER BY at DESC,event_id DESC LIMIT 201`,[ctx.owner,branch,at,id]);await c.query('COMMIT');c.release();c=undefined;const recent=await readSpace(ctx.owner),events=activityPage(result.rows.map(r=>r.payload as import('../../lib/domain').Event),recent.state.events,branch,at&&id?{at,id}:undefined);return reply({events:events.slice(0,200),more:events.length>200});
 }catch(error){if(c)await c.query('ROLLBACK');if(error instanceof CommercialError)return reply({error:error.code},error.status);return reply({error:'unavailable'},503);}finally{c?.release();}}
