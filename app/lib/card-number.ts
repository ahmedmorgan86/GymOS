import type {PoolClient} from 'pg';
/** Global registry allocator; the caller wraps it in the owner's scoped transaction. */
export async function reserveDailyCard(client:PoolClient,owner:string,member:string,branch:string,day:string){
 const date=day.replaceAll('-','');if(!/^\d{8}$/.test(date))throw Error('invalid date');
 const prior=async()=>{
  const row=await client.query<{code:string}>("SELECT code FROM gymos.membership_cards WHERE owner_id=$1 AND member_id=$2 AND branch=$3 AND status='reserved' ORDER BY created_at DESC,code DESC LIMIT 1",[owner,member,branch]);
  return row.rows[0]?.code;
 };
 // A lost HTTP response must not allocate another card for the same pending form.
 const existing=await prior();if(existing)return existing;
 // Imported/manual cards may already occupy a candidate. Never overwrite or reassign them.
 for(let attempt=0;attempt<100;attempt++){
  const counter=await client.query<{value:number}>("INSERT INTO gymos.card_number_counters(day,value) VALUES($1,1) ON CONFLICT(day) DO UPDATE SET value=card_number_counters.value+1 RETURNING value",[date]);
  // The daily counter serializes allocators. Recheck after waiting for its lock,
  // so concurrent retries of the same member return the first committed card.
  const concurrent=await prior();if(concurrent)return concurrent;
  const code=date+'-'+String(counter.rows[0].value).padStart(4,'0');
  const reserved=await client.query("INSERT INTO gymos.membership_cards(code,owner_id,member_id,branch,status) VALUES($1,$2,$3,$4,'reserved') ON CONFLICT(code) DO NOTHING RETURNING code",[code,owner,member,branch]);
  if(reserved.rowCount)return code;
 }
 throw Error('Daily card range busy');
}
