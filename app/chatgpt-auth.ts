// Compatibility exports for existing screens; identity comes only from Supabase Auth.
import {redirect} from 'next/navigation';
import {serverAuth} from './lib/auth';
import {verifiedUser,type VerifiedUser} from './lib/verified-user';
export type ChatGPTUser=VerifiedUser;
export async function getChatGPTUser():Promise<ChatGPTUser|null>{return verifiedUser((await serverAuth()).auth);}
export async function requireChatGPTUser(_returnTo:string){void _returnTo;const user=await getChatGPTUser();if(user)return user;redirect('/sign-in');}
export function chatGPTSignInPath(_returnTo='/'){void _returnTo;return '/sign-in';}
export function chatGPTSignOutPath(_returnTo='/'){void _returnTo;return '/sign-out';}
