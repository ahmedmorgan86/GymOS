import {z} from 'zod';
import {RuleError,type GymState,type Operation} from './domain.ts';
const id=z.string().min(1).max(250),name=z.string().trim().min(1).max(150);
const qty=z.number().int().min(1).max(100000),money=z.number().int().min(0).max(100000000);
const day=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
export const productSchema=z.object({id,branch:id,name,sku:name,category:z.enum(['protein','creatine','vitamins','snacks','accessories','other']),price:money.refine(v=>v>0),lowStock:z.number().int().min(0).max(100000),archived:z.boolean()}).strict();
export const lotSchema=z.object({id,branch:id,product:id,batch:name,expires:day,received:qty,remaining:z.number().int().min(0).max(100000),cost:money,at:z.string().datetime({offset:true})}).strict();
const lineSchema=z.object({product:id,lot:id,name,sku:name,batch:name,expires:day,quantity:qty,price:money.refine(v=>v>0),cost:money}).strict();
export const saleSchema=z.object({id,branch:id,at:z.string().datetime({offset:true}),member:id.nullable(),method:z.enum(['cash','card','transfer']),lines:z.array(lineSchema).min(1).max(500),total:z.number().int().min(1).max(1e10),voided:z.boolean(),reason:z.string().max(500)}).strict();
export type Product=z.infer<typeof productSchema>;export type StockLot=z.infer<typeof lotSchema>;export type ShopSale=z.infer<typeof saleSchema>;
function parse<T>(schema:z.ZodType<T>,value:unknown):T{const r=schema.safeParse(value);if(!r.success)throw new RuleError('invalid');return r.data;}
export function shopOperation(s:GymState,op:Operation,today:string,now:string,newId:()=>string){
 if(!op.type.startsWith('shop.'))return false;
 s.products??=[];s.stockLots??=[];s.shopSales??=[];
 const product=(value:unknown)=>{const p=s.products!.find(p=>p.id===value&&p.branch===op.branch);if(!p)throw new RuleError('notFound');return p;};
 switch(op.type){
 case 'shop.product.save':{const old=op.id?product(op.id):null;const p=parse(productSchema,{id:old?.id??newId(),branch:op.branch,name:op.name,sku:op.sku,category:op.category,price:op.price,lowStock:op.lowStock,archived:op.archived===true});if(s.products.some(x=>x.branch===op.branch&&x.id!==p.id&&x.sku.toLowerCase()===p.sku.toLowerCase()))throw new RuleError('invalid');if(old)Object.assign(old,p);else s.products.push(p);break;}
 case 'shop.stock.receive':{const p=product(op.product);if(p.archived)throw new RuleError('inactive');const lot=parse(lotSchema,{id:newId(),branch:op.branch,product:p.id,batch:op.batch,expires:op.expires,received:op.quantity,remaining:op.quantity,cost:op.cost,at:now});if(lot.expires<today)throw new RuleError('dates');s.stockLots.push(lot);break;}
 case 'shop.sale.add':{if(op.member!=null&&!s.members.some(m=>m.id===op.member&&m.branch===op.branch&&!m.archived&&!m.demo))throw new RuleError('notFound');const items=parse(z.array(z.object({product:id,quantity:qty}).strict()).min(1).max(50),op.items);if(new Set(items.map(i=>i.product)).size!==items.length)throw new RuleError('invalid');const lines:ShopSale['lines']=[];for(const item of items){const p=product(item.product);if(p.archived)throw new RuleError('inactive');let needed=item.quantity;const lots=s.stockLots.filter(l=>l.branch===op.branch&&l.product===p.id&&l.expires>=today&&l.remaining>0).sort((a,b)=>a.expires.localeCompare(b.expires)||a.at.localeCompare(b.at)||a.id.localeCompare(b.id));for(const lot of lots){const take=Math.min(needed,lot.remaining);if(!take)break;lot.remaining-=take;needed-=take;lines.push({product:p.id,lot:lot.id,name:p.name,sku:p.sku,batch:lot.batch,expires:lot.expires,quantity:take,price:p.price,cost:lot.cost});}if(needed)throw new RuleError('stock');}const total=lines.reduce((a,l)=>a+l.price*l.quantity,0);s.shopSales.push(parse(saleSchema,{id:newId(),branch:op.branch,at:now,member:op.member??null,method:op.method,lines,total,voided:false,reason:''}));break;}
 case 'shop.sale.void':{const sale=s.shopSales.find(x=>x.id===op.id&&x.branch===op.branch);if(!sale||sale.voided)throw new RuleError('transition');const reason=parse(z.string().trim().min(1).max(500),op.reason);for(const line of sale.lines){const lot=s.stockLots.find(l=>l.id===line.lot&&l.branch===op.branch);if(!lot)throw new RuleError('notFound');lot.remaining+=line.quantity;}sale.voided=true;sale.reason=reason;break;}
 default:throw new RuleError('invalid');
 }
 if(s.products.length>1000||s.stockLots.length>10000||s.shopSales.length>10000)throw new RuleError('limit');return true;
}
export function validateShop(s:GymState){
 const products=s.products??[],lots=s.stockLots??[],sales=s.shopSales??[];const skus=new Set<string>();for(const p of products){const key=p.branch+'|'+p.sku.toLowerCase();if(skus.has(key))throw Error('duplicate SKU');skus.add(key);}
 const used=new Map<string,number>();for(const sale of sales){if(sale.member!==null&&!s.members.some(m=>m.id===sale.member&&m.branch===sale.branch&&!m.demo))throw Error('shop member');let total=0;for(const line of sale.lines){const lot=lots.find(l=>l.id===line.lot&&l.branch===sale.branch&&l.product===line.product);if(!lot||line.batch!==lot.batch||line.expires!==lot.expires||line.cost!==lot.cost)throw Error('shop lot');total+=line.quantity*line.price;if(!sale.voided)used.set(lot.id,(used.get(lot.id)??0)+line.quantity);}if(total!==sale.total)throw Error('shop total');}
 for(const lot of lots)if(!products.some(p=>p.id===lot.product&&p.branch===lot.branch)||lot.remaining!==lot.received-(used.get(lot.id)??0))throw Error('shop stock');
}
