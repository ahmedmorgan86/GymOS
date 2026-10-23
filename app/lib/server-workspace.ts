import {commercialEnabled,commercialContext} from './commercial';
import {trialClosed,CommercialError,type License} from './licensing';
import {readEntitySpace} from './entity-store';
import {db} from './database';
import {cookies} from 'next/headers';
import {getChatGPTUser} from '../chatgpt-auth';
import {emptyState,type GymState} from './domain';
import {normalize} from './extensions';
import {fullAdministration,type Role} from './access';
export async function context(allowClosedTrial=false){const user=await getChatGPTUser();if(!user)return null;const gym=(await cookies()).get('gymos-space')?.value;if(commercialEnabled()){const club=await commercialContext(user,gym);if(!allowClosedTrial&&trialClosed(club.license))throw new CommercialError('trialExpired',403);return{user,owner:club.storage_key,tenantId:club.id,license:club.license,role:club.role,branches:club.branches};}if(!gym||gym===user.userId)return{user,owner:user.userId,tenantId:user.userId,license:null as License|null,role:'owner' as Role,branches:null as string[]|null};const membership=await db.prepare('SELECT role,branches FROM gym_access WHERE owner_id=? AND user_id=? AND revoked=0').bind(gym,user.userId).first<{role:Role;branches:string}>(gym);if(!membership)throw new Error('forbidden');return{user,owner:gym,tenantId:gym,license:null as License|null,role:membership.role,branches:JSON.parse(membership.branches) as string[]};}
export async function administrator(ctx:NonNullable<Awaited<ReturnType<typeof context>>>){const space=await readSpace(ctx.owner);return fullAdministration(ctx.role,ctx.branches,space.state.branches.map(b=>b.id));}
export type Context=NonNullable<Awaited<ReturnType<typeof context>>>;
export async function readSpace(owner:string){let row=await db.prepare('SELECT payload,revision FROM gym_states WHERE user_id=?').bind(owner).first<{payload:string;revision:number}>(owner);if(!row){const state=emptyState();await db.prepare('INSERT OR IGNORE INTO gym_states(user_id,payload,revision,updated_at) VALUES(?,?,0,?)').bind(owner,JSON.stringify(state),new Date().toISOString()).run(owner);row=await db.prepare('SELECT payload,revision FROM gym_states WHERE user_id=?').bind(owner).first<{payload:string;revision:number}>(owner);}if(!row)throw Error('unavailable');if(JSON.parse(row.payload)._entityStorage===1){const stored=await readEntitySpace(owner);return{state:normalize(stored.state),revision:stored.revision};}return{state:normalize(JSON.parse(row.payload) as GymState),revision:row.revision};}
export {packet} from './workspace-packet';
export const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function hash(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
