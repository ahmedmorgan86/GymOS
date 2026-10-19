import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {currentBrand} from '../../../lib/server-branding';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(request:Request){try{const requested=Number(new URL(request.url).searchParams.get('size')),size=[32,64,180,192,256,512].includes(requested)?requested:192;const brand=await currentBrand(request);const source=brand?.logo?Buffer.from(brand.logo.slice(22),'base64'):await readFile(join(process.cwd(),'public/icons/icon-512.png'));const data=await sharp(source,{limitInputPixels:16777216}).resize(size,size,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();return new Response(new Uint8Array(data),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin'}});}catch{return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});}}
