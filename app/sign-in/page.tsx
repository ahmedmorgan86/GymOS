import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {redirectAuthFlow} from '../lib/auth-flow-origin';
import Login from './login';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;if(query.register==='1'){const origin=redirectAuthFlow((await headers()).get('host'));if(origin)redirect(origin+'/sign-in?register=1');}return <Login initialSignup={query.register==='1'}/>;}
