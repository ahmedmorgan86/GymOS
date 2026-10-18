// Compatibility exports for existing screens; identity comes only from Supabase Auth.
import {redirect} from 'next/navigation';
import {serverAuth} from './lib/auth';
import {getPool} from './lib/database';
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{const supabase=await serverAuth();const {data,error}=await supabase.auth.getUser();if(error||!data.user||data.user.is_anonymous)return null;const {data:claims}=await supabase.auth.getClaims();const sessionId=claims?.claims.session_id;if(typeof sessionId!=='string')return null;const session=await getPool().query('SELECT id FROM auth.sessions WHERE id=$1 AND user_id=$2',[sessionId,data.user.id]);if(!session.rowCount)return null;const name=typeof data.user.user_metadata?.name==='string'?data.user.user_metadata.name.slice(0,150):null;return{userId:data.user.id,displayName:name||data.user.email||'Member',email:data.user.email??'',fullName:name};}
export async function requireChatGPTUser(_returnTo:string){const user=await getChatGPTUser();if(user)return user;redirect('/sign-in');}
export function chatGPTSignInPath(_returnTo='/'){return '/sign-in';}
export function chatGPTSignOutPath(_returnTo='/'){return '/sign-out';}
