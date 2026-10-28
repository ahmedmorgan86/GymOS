import {context} from './server-workspace';
import {db} from './database';
import {validBrandLogo} from './branding';
export async function currentBrand(request:Request){const ctx=await context();const expected=new URL(request.url).searchParams.get('owner');if(!ctx||expected!==ctx.tenantId)return null;const row=await db.prepare('SELECT payload FROM gym_states WHERE user_id=?').bind(ctx.owner).first<{payload:string}>(ctx.owner);if(!row)return null;const settings=JSON.parse(row.payload).settings;return{owner:ctx.tenantId,name:String(settings.name??'GYMEG').slice(0,120),logo:validBrandLogo(settings.logo)?settings.logo:null};}
