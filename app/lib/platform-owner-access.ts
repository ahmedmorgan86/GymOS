import type {PoolClient} from 'pg';
import {ownerComplimentary} from './platform-owner-license.ts';

// Authority must come from the verified account and the server-side admin lookup.
export async function platformOwnerClub(client:Pick<PoolClient,'query'>,platform:boolean,actor:string,id?:string){
 if(!ownerComplimentary(platform,actor)||!id)return null;
 const club=(await client.query('SELECT id,storage_key,name FROM gymos.tenants WHERE id=$1 OR storage_key=$1',[id])).rows[0];
 if(!club)return null;
 await client.query("SELECT set_config('app.tenant',$1,true)",[club.id]);
 return {...club,role:'owner' as const,branches:null};
}
