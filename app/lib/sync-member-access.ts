import type {PoolClient} from 'pg';import {createHash} from 'node:crypto';import {normalizeMemberPhone} from './member-phone-format.ts';import type {Member} from './domain.ts';
/** Must run inside the caller's transaction. Nothing is externally visible between batches. */
export async function syncMemberAccess(client:Pick<PoolClient,'query'>,members:Member[]){
 const all=JSON.stringify(members);if(members.length<=50){await client.query('SELECT gymos.sync_member_codes($1::jsonb)',[all]);return;}
 const rows=(await client.query("SELECT member_id,phone_hash,pin_hash IS NOT NULL AS has_pin FROM gymos.member_code_access WHERE owner_id=current_setting('app.gym_owner',true)")).rows as {member_id:string;phone_hash:string|null;has_pin:boolean}[];
 const existing=new Map(rows.map(r=>[r.member_id,r]));const pending=members.filter(m=>{if(m.demo||m.archived)return false;const old=existing.get(m.id),phone=normalizeMemberPhone(m.phone),digest=phone?createHash('sha256').update(phone).digest('hex'):null;return !old||old.phone_hash!==digest||Boolean(phone&&!old.has_pin);});
 if(pending.length<=50){await client.query('SELECT gymos.sync_member_codes($1::jsonb)',[all]);return;}
 // Partial calls temporarily mark other entries inactive. The final complete reconciliation
 // is mandatory before the enclosing COMMIT; any failure rolls the entire operation back.
 for(let i=0;i<pending.length;i+=50)await client.query('SELECT gymos.sync_member_codes($1::jsonb)',[JSON.stringify(pending.slice(i,i+50))]);
 await client.query('SELECT gymos.sync_member_code_accounts($1::jsonb)',[all]);
}
