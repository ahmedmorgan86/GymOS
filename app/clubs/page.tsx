import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import {commercialEnabled,commercialDirectory} from '../lib/commercial';
import CommercialPanel from '../commercial-panel';
export const dynamic='force-dynamic';
export default async function Clubs(){const user=await requireChatGPTUser('/clubs');if(!commercialEnabled())notFound();return <CommercialPanel initialData={await commercialDirectory(user)}/>;}
