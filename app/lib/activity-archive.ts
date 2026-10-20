import {getPool} from './database.ts';
import type {Event} from './domain.ts';
export const RECENT_EVENTS=2000;
export async function archivedEvents(owner:string):Promise<Event[]>{
 const c=await getPool().connect();try{await c.query('BEGIN');await c.query("SELECT set_config('app.gym_owner',$1,true)",[owner]);const rows=await c.query('SELECT payload FROM gymos.gym_activity_archive WHERE owner_id=$1 ORDER BY at,event_id',[owner]);await c.query('COMMIT');return rows.rows.map(r=>r.payload as Event);}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}
}
