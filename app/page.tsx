import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {commercialEnabled,commercialContext} from './lib/commercial';
import {CommercialError} from './lib/licensing';
import Workspace from "./workspace";
import {getChatGPTUser} from "./chatgpt-auth";
import PublicSite from "./public-site";
import {publicMetadata,siteOrigin} from './lib/seo';
export async function generateMetadata(){if(await getChatGPTUser())return{robots:{index:false,follow:false},other:{'gymos-offline-shell':'1'}};const meta=publicMetadata();return{...meta,alternates:{...meta.alternates,canonical:siteOrigin()+'/'}};}
export const dynamic="force-dynamic";
export default async function Home(){const user=await getChatGPTUser();if(!user)return <PublicSite en={false}/>;if(commercialEnabled()){try{await commercialContext(user,(await cookies()).get('gymos-space')?.value,(await cookies()).get('gymos-support')?.value);}catch(error){if(error instanceof CommercialError&&['chooseClub','supportExpired'].includes(error.code))redirect('/clubs');throw error;}}return <Workspace/>;}
