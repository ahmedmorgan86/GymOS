import {getPool} from '../../../lib/database';
import {reply} from '../../../lib/server-workspace';
import {runWhatsApp} from '../../../lib/whatsapp-server';
export const maxDuration=60;
export async function GET(request:Request){const actual=request.headers.get('authorization')??'';if(!/^Bearer [a-f0-9]{64}$/.test(actual)||!(await getPool().query('SELECT gymos.messaging_cron_valid($1) AS valid',[actual.slice(7)])).rows[0]?.valid)return reply({error:'forbidden'},403);const client=await getPool().connect();let owners;try{await client.query('BEGIN');await client.query("SELECT set_config('app.messaging_worker','1',true)");owners=(await client.query("SELECT owner_id FROM gymos.whatsapp_connections GROUP BY owner_id ORDER BY min(COALESCE(last_run_at,'1970-01-01'::timestamptz)) LIMIT 100")).rows;await client.query('COMMIT');}catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}let sent=0;const deadline=Date.now()+40000;for(const row of owners){if(Date.now()>deadline)break;try{sent+=(await runWhatsApp(row.owner_id,undefined,deadline)).sent;}catch{/* isolate tenant failures */}await clientUpdate(row.owner_id);}return reply({sent});}

async function clientUpdate(owner:string){const {withScope}=await import('../../../lib/database');await withScope(owner,c=>c.query('UPDATE gymos.whatsapp_connections SET last_run_at=now() WHERE owner_id=$1',[owner]));}
