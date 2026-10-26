import {workspaceRequested} from './lib/navigation';
import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {commercialEnabled,commercialContext} from './lib/commercial';
import {CommercialError} from './lib/licensing';
import Workspace from "./workspace";
import {getChatGPTUser} from "./chatgpt-auth";
import PublicSite from "./public-site";
import {publicMetadata,siteOrigin} from './lib/seo';
type HomeProps={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function generateMetadata({searchParams}:HomeProps){if(workspaceRequested(await searchParams)&&await getChatGPTUser())return{robots:{index:false,follow:false},other:{'gymos-offline-shell':'1'}};const meta=publicMetadata();return{...meta,alternates:{...meta.alternates,canonical:siteOrigin()+'/'}};}
export const dynamic="force-dynamic";
export default async function Home({searchParams}:HomeProps){if(!workspaceRequested(await searchParams))return <PublicSite en={false}/>;const user=await getChatGPTUser();if(!user)redirect('/sign-in');if(commercialEnabled()){try{await commercialContext(user,(await cookies()).get('gymos-space')?.value,(await cookies()).get('gymos-support')?.value);}catch(error){if(error instanceof CommercialError&&['chooseClub','supportExpired'].includes(error.code))redirect('/clubs');throw error;}}return <Workspace/>;}
