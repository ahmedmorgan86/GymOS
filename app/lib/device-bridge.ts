import {createHash,createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {applyOperation,type GymState} from './domain.ts';
import {emptyEngagement} from './engagement.ts';
export const deviceEventSchema=z.object({eventId:z.string().regex(/^[A-Za-z0-9_-]{8,100}$/),personId:z.string().min(1).max(250),direction:z.enum(['in','out']),at:z.string().datetime({offset:true})}).strict();
export function verifyDeviceSignature(raw:string,timestamp:string,signature:string,secret:string,now=Date.now()){
 if(secret.length<32||!/^\d{10}$/.test(timestamp)||Math.abs(now-Number(timestamp)*1000)>300000||!/^[a-f0-9]{64}$/.test(signature))return false;
 return timingSafeEqual(Buffer.from(signature,'hex'),createHmac('sha256',secret).update(timestamp+'.'+raw).digest());
}
/** Device identifies people locally. No fingerprint image/template crosses this boundary. */
export function ingestDeviceEvent(source:GymState,branch:string,deviceId:string,input:unknown,now:string,newId:()=>string){
 const data=deviceEventSchema.parse(input);if(Math.abs(Date.parse(data.at)-Date.parse(now))>300000)throw Error('staleEvent');
 const d=source.engagement?.devices.find(d=>d.id===deviceId&&d.branch===branch&&d.enabled);if(!d)throw Error('disabledDevice');
 const mapping=d.mappings.find(m=>m.person===data.personId);if(!mapping)throw Error('unknownPerson');
 const key=deviceId+':'+data.eventId,digest=createHash('sha256').update(JSON.stringify(data)).digest('hex'),old=source.engagement!.deviceEvents.find(x=>x.id===key);
 if(old){if(old.digest!==digest)throw Error('eventConflict');return{state:source,duplicate:true};}
 const state=applyOperation(source,{type:data.direction==='in'?'visit.add':'visit.exit',id:mapping.member,branch},now,'Device '+deviceId,newId);
 state.engagement??=emptyEngagement();state.engagement.deviceEvents=state.engagement.deviceEvents.filter(x=>Date.parse(x.at)>Date.parse(now)-3600000);
 if(state.engagement.deviceEvents.length>=10000)throw Error('limit');state.engagement.deviceEvents.push({id:key,device:deviceId,branch,digest,at:now});return{state,duplicate:false};
}
