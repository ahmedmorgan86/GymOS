import {getPool} from '../../lib/database';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){try{const r=await getPool().query("SELECT to_regclass('gymos.gym_states') IS NOT NULL AS ready");if(!r.rows[0]?.ready)throw Error();return Response.json({status:'ready'},{headers:{'Cache-Control':'no-store'}});}catch(e){console.error('database_health',e&&typeof e==='object'&&'code' in e?String(e.code):'unavailable');return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}}
