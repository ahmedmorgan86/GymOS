import type {GymState} from './domain.ts';
export const importFields={members:['id','name','phone','joined','expires','card'],plans:['id','name','days','amount','visits'],payments:['id','member','amount','day','method']} as const;
export type ImportKind=keyof typeof importFields;
export type ImportRow=Record<string,string>;
export function parseCSV(text:string):string[][]{
 if(new TextEncoder().encode(text).length>1_000_000)throw Error('File exceeds 1 MB');
 const rows:string[][]=[];let row:string[]=[],cell='',quoted=false;
 text=text.replace(/^\uFEFF/,'');
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else if(quoted)quoted=false;else if(cell==='')quoted=true;else throw Error('Invalid CSV quotes');}
 else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;
 if(rows.length>501||row.length>50||cell.length>2000)throw Error('CSV limit exceeded');}
 if(quoted)throw Error('Unclosed CSV quote');row.push(cell);if(row.some(x=>x.trim()))rows.push(row);
 if(rows.length<2||rows.length>501||rows.some(r=>r.length!==rows[0].length))throw Error('Use a header and up to 500 equal-width rows');return rows;
}
const digits=(s:string)=>s.replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));
function date(s:string){s=digits(s);if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))||new Date(s+'T12:00:00Z').toISOString().slice(0,10)!==s)throw Error('Date must be YYYY-MM-DD');return s;}
function money(s:string){s=digits(s);if(!/^\d{1,9}(\.\d{1,2})?$/.test(s))throw Error('Amount: use a positive number with at most 2 decimals');const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(n<1||n>1e10)throw Error('Amount out of range');return n;}
function integer(s:string,max:number){const n=Number(digits(s));if(!/^\d+$/.test(digits(s))||!Number.isSafeInteger(n)||n<1||n>max)throw Error('Invalid positive integer');return n;}
export function legacyId(branch:string,source:string,kind:string,id:string){if(!/^[a-zA-Z0-9_-]{1,40}$/.test(source)||!id||id.length>80)throw Error('Source or legacy ID invalid');const value='legacy:'+JSON.stringify([branch,source,kind,id]);if(value.length>250)throw Error('Legacy ID too long');return value;}
export function previewImport(original:GymState,branch:string,source:string,kind:ImportKind,rows:ImportRow[],today:string){
 if(!original.branches.some(b=>b.id===branch)||!Object.hasOwn(importFields,kind)||!Array.isArray(rows)||!rows.length||rows.length>500)throw Error('Invalid import');
 const state=structuredClone(original),errors:{row:number;message:string}[]=[];let added=0,skipped=0;
 const seen=new Set<string>();
 rows.forEach((r,index)=>{try{
 if(!r||typeof r!=='object'||Object.values(r).some(v=>typeof v!=='string'||v.length>2000))throw Error('Invalid row');
 const id=legacyId(branch,source,kind,r.id?.trim());if(seen.has(id))throw Error('Repeated legacy ID in file');seen.add(id);
 const name=(r.name??'').trim();if(kind!=='payments'&&(!name||name.length>150))throw Error('Name is required (max 150)');
 let record;let collection;
 if(kind==='members'){const joined=date(r.joined??''),expires=date(r.expires??'');if(joined>today||expires<joined)throw Error('Invalid membership dates');const phone=(r.phone??'').trim(),card=(r.card??'').trim().toUpperCase();if(phone.length>40||card&&!/^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(card))throw Error('Invalid phone or card');if(card&&state.members.some(m=>m.id!==id&&m.card===card))throw Error('Card already assigned');record={id,name,phone,joined,expires,demo:false,archived:false,consent:false,branch,...(card?{card}:{})};collection=state.members;}
 else if(kind==='plans'){record={id,name,days:integer(r.days??'',3660),minor:money(r.amount??''),visits:r.visits?integer(r.visits,10000):null,branch,archived:false};state.plans??=[];collection=state.plans;}
 else{const member=legacyId(branch,source,'members',(r.member??'').trim());if(!state.members.some(m=>m.id===member&&m.branch===branch))throw Error('Import the member with this legacy ID first');const day=date(r.day??'');if(day>today)throw Error('Payment date is in the future');if(state.cashClosures?.some(c=>c.branch===branch&&c.day===day))throw Error('Payment date already has a cash closure');if(!['cash','card','transfer'].includes(r.method))throw Error('Method: cash / card / transfer');record={id,member,minor:money(r.amount??''),day,method:r.method,branch,voided:false};collection=state.payments;}
 const existing=collection.find(x=>x.id===id);if(existing){if(Object.entries(record).some(([key,value])=>(existing as unknown as Record<string,unknown>)[key]!==value))throw Error('Legacy ID exists with different data; no overwrite');skipped++;}else{(collection as unknown[]).push(record);added++;}
 }catch(e){errors.push({row:index+2,message:e instanceof Error?e.message:'Invalid row'});}});
 if(state.members.length>10000||(state.plans?.length??0)>1000||state.payments.length>100000)errors.push({row:0,message:'Workspace capacity exceeded'});
 return{state,added,skipped,errors};
}

export function parseLegacyFile(text:string,kind:ImportKind){if(!text.trimStart().startsWith('[')&&!text.trimStart().startsWith('{'))return parseCSV(text);if(new TextEncoder().encode(text).length>1_000_000)throw Error('Max 1 MB');const parsed=JSON.parse(text),rows=Array.isArray(parsed)?parsed:parsed[kind];if(!Array.isArray(rows)||!rows.length||rows.length>500||rows.some(r=>!r||Array.isArray(r)||typeof r!=='object'))throw Error('Use an array of records or a members/plans/payments array');const headers=[...new Set(rows.flatMap(r=>Object.keys(r)))];if(headers.length>50)throw Error('Max 50 columns');return[headers,...rows.map(r=>headers.map(k=>r[k]===null||r[k]===undefined?'':typeof r[k]==='object'?JSON.stringify(r[k]):String(r[k])))];}
