import {z} from 'zod';
const connection=z.object({dailyLimit:z.number().int().min(1).max(1000).default(50),owner:z.string().min(1),branch:z.string().min(1),account:z.string().regex(/^AC[a-fA-F0-9]{32}$/),token:z.string().min(16).max(200),from:z.string().regex(/^(\+[1-9]\d{7,14}|[A-Za-z][A-Za-z0-9]{0,10})$/)}).strict();
export function smsConnection(owner:string,branch:string,raw:string){const rows=z.array(connection).max(1000).parse(JSON.parse(raw));const matches=rows.filter(x=>x.owner===owner&&x.branch===branch);if(matches.length!==1)throw Error('notConfigured');return matches[0];}
export async function submitSms(c:z.infer<typeof connection>,to:string,text:string,transport:typeof fetch=fetch){
 if(!/^\+[1-9]\d{7,14}$/.test(to)||!text||text.length>480)throw Error('invalid');
 const response=await transport(`https://api.twilio.com/2010-04-01/Accounts/${c.account}/Messages.json`,{method:'POST',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Authorization:'Basic '+Buffer.from(c.account+':'+c.token).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({To:to,From:c.from,Body:text})});
 if(!response.ok)throw Error('providerRejected');const data=await response.json();if(typeof data.sid!=='string'||!/^SM[a-fA-F0-9]{32}$/.test(data.sid))throw Error('providerUnknown');return{providerId:data.sid,status:'submitted' as const};
}
