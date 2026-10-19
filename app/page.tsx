import {redirect} from 'next/navigation';
import {cookies} from 'next/headers';
import {commercialEnabled,commercialContext} from './lib/commercial';
import {CommercialError} from './lib/licensing';
import Workspace from "./workspace";
import {requireChatGPTUser} from "./chatgpt-auth";
export const metadata={other:{'gymos-offline-shell':'1'}};
export const dynamic="force-dynamic";
export default async function Home(){const user=await requireChatGPTUser("/");if(commercialEnabled()){try{await commercialContext(user,(await cookies()).get('gymos-space')?.value);}catch(error){if(error instanceof CommercialError&&error.code==='chooseClub')redirect('/clubs');throw error;}}return <Workspace/>;}
