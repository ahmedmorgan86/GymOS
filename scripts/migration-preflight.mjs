/** Base bootstrap must never replay permissive legacy policies over an existing schema. */
export async function assertFreshDatabase(client){
 const {rows}=await client.query("SELECT to_regclass('gymos.gym_states') IS NOT NULL AS workspace_exists, to_regclass('gymos.tenants') IS NOT NULL AS commercial_exists");
 if(rows[0]?.workspace_exists||rows[0]?.commercial_exists)throw new Error('Refusing base bootstrap on an existing GymEG database. Review migration history and apply only reviewed incremental migrations; replaying base SQL can replace tenant RLS policies.');
}
