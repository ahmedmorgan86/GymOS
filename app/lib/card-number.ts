import type {PoolClient} from 'pg';
/** Global registry allocator; the caller wraps it in the owner's scoped transaction. */
export async function reserveDailyCard(client:PoolClient,owner:string,member:string,branch:string,day:string){
 const date=day.replaceAll('-','');if(!/^\d{8}$/.test(date))throw Error('invalid date');
 // Imported/manual cards may already occupy a candidate. Never overwrite or reassign them.
 for(let attempt=0;attempt<100;attempt++){
  const counter=await client.query<{value:number}>("INSERT INTO gymos.card_number_counters(day,value) VALUES($1,1) ON CONFLICT(day) DO UPDATE SET value=card_number_counters.value+1 RETURNING value",[date]);
  const code=date+'-'+String(counter.rows[0].value).padStart(4,'0');
  const reserved=await client.query("INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status) VALUES($1,$2,$3,$4,'reserved') ON CONFLICT(code) DO NOTHING RETURNING code",[code,owner,member,branch]);
  if(reserved.rowCount)return code;
 }
 throw Error('Daily card range busy');
}
