import {notFound} from 'next/navigation';
import {requireChatGPTUser} from '../chatgpt-auth';
import {commercialEnabled,commercialTransaction,commercialDirectory} from '../lib/commercial';
import CommercialPanel from '../commercial-panel';
export const dynamic='force-dynamic';
export default async function Platform(){const user=await requireChatGPTUser('/platform');if(!commercialEnabled()||!await commercialTransaction(user,async(_client,platform)=>platform))notFound();return <CommercialPanel platform initialData={await commercialDirectory(user,true)}/>;}
