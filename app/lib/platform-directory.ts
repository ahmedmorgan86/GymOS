import type {PoolClient} from 'pg';
import type {CommercialClub} from './commercial-types';
// Display only: does not create a membership, select a tenant, or confer workspace access.
export async function appendPlatformClubs(client:Pick<PoolClient,'query'>,platform:boolean,owned:CommercialClub[]):Promise<CommercialClub[]>{
 if(!platform)return owned;
 const listed=new Set(owned.map(c=>c.id));
 const rows=(await client.query('SELECT t.id,t.name,l.plan_id,l.mode,l.status,l.ends_at,l.maintenance_until FROM gymos.tenants t JOIN gymos.tenant_licenses l ON l.tenant_id=t.id ORDER BY t.created_at DESC,t.id')).rows;
 return [...owned,...rows.filter(row=>!listed.has(row.id)).map(row=>({id:row.id,name:row.name,role:'platform-observer',license:{plan_id:row.plan_id,mode:row.mode,status:row.status,ends_at:row.ends_at,maintenance_until:row.maintenance_until}}))];
}
