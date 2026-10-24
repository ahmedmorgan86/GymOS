import {z} from 'zod';
import {readSpace,reply} from '../../lib/server-workspace';
import {persistSpace} from '../../lib/entity-store';
import {ingestDeviceEvent,verifyDeviceSignature} from '../../lib/device-bridge';
const bridges=z.array(z.object({device:z.string().min(1).max(150),owner:z.string().min(1).max(250),branch:z.string().min(1).max(250),secret:z.string().min(32).max(200)}).strict()).max(1000);
export async function POST(request:Request){
 try{
  if(process.env.GYMOS_DEVICE_BRIDGE_ENABLED!=='1')return reply({error:'notConfigured'},503);
  if(request.headers.get('content-type')?.split(';')[0]!=='application/json')return reply({error:'invalid'},415);
  const raw=await request.text();if(new TextEncoder().encode(raw).byteLength>2048)return reply({error:'limit'},413);
  const config=bridges.parse(JSON.parse(process.env.GYMOS_DEVICE_BRIDGES??'[]')),device=request.headers.get('x-gymos-device');
  if(new Set(config.map(c=>c.device)).size!==config.length)throw Error('invalid config');
  const binding=config.find(c=>c.device===device);if(!binding||!verifyDeviceSignature(raw,request.headers.get('x-gymos-timestamp')??'',request.headers.get('x-gymos-signature')??'',binding.secret))return reply({error:'unauthorized'},401);
  const current=await readSpace(binding.owner),result=ingestDeviceEvent(current.state,binding.branch,binding.device,JSON.parse(raw),new Date().toISOString(),()=>crypto.randomUUID());
  if(!result.duplicate&&!await persistSpace(binding.owner,current,result.state))return reply({error:'conflict'},409);
  return reply({ok:true,duplicate:result.duplicate});
 }catch{return reply({error:'eventRejected'},400);}
}
