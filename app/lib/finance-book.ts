import {z} from 'zod';
import {RuleError,dayAt,type GymState,type Operation} from './domain.ts';
import {shopOperation} from './shop.ts';
const id=z.string().min(1).max(250),stamp=z.string().datetime({offset:true}),amount=z.number().int().min(1).max(1e10),zero=z.number().int().min(0).max(1e10),method=z.enum(['cash','card','transfer']);
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v);
const expense=z.object({id,branch:id,category:z.enum(['rent','utilities','maintenance','salary','marketing','other']),title:z.string().trim().min(1).max(150),minor:amount,method,day:date,at:stamp,actor:id,voided:z.boolean(),reason:z.string().max(500)}).strict();
const purchase=z.object({id,branch:id,supplier:id,reference:z.string().trim().min(1).max(150),due:date,at:stamp,total:amount,lines:z.array(z.object({lot:id,product:id,name:z.string().min(1).max(150),quantity:z.number().int().min(1).max(100000),cost:zero,batch:z.string().min(1).max(150),expires:date}).strict()).min(1).max(50)}).strict();
const payment=z.object({id,branch:id,purchase:id,minor:amount,method,at:stamp,actor:id}).strict();
const shift=z.object({id,branch:id,openedAt:stamp,actor:id,opening:zero,closedAt:stamp.optional(),closedBy:id.optional(),actual:zero.optional(),expected:z.number().int().optional(),difference:z.number().int().optional(),note:z.string().max(500)}).strict();
const movement=z.object({id,branch:id,shift:id.optional(),at:stamp,actor:id,source:id,kind:z.string().max(100),minor:z.number().int().min(-1e10).max(1e10).refine(n=>n!==0)}).strict();
export const financeBookSchema=z.object({expenses:z.array(expense).max(10000),purchases:z.array(purchase).max(10000),supplierPayments:z.array(payment).max(100000),shifts:z.array(shift).max(10000),movements:z.array(movement).max(100000)}).strict();
export type FinanceBook=z.infer<typeof financeBookSchema>;
export const emptyFinanceBook=():FinanceBook=>({expenses:[],purchases:[],supplierPayments:[],shifts:[],movements:[]});
export function supplierDue(s:GymState,purchaseId:string){const b=s.financeBook??emptyFinanceBook(),p=b.purchases.find(p=>p.id===purchaseId);return p?p.total-b.supplierPayments.filter(x=>x.purchase===p.id&&x.branch===p.branch).reduce((n,x)=>n+x.minor,0):0;}
export function shiftExpected(s:GymState,shiftId:string){const b=s.financeBook??emptyFinanceBook(),x=b.shifts.find(x=>x.id===shiftId);if(!x)throw new RuleError('notFound');return x.opening+b.movements.filter(m=>m.shift===x.id&&m.branch===x.branch).reduce((n,m)=>n+m.minor,0);}
export function validateFinanceBook(s:GymState){const b=s.financeBook;if(!b)return;financeBookSchema.parse(b);
 for(const rows of [b.expenses,b.purchases,b.supplierPayments,b.shifts,b.movements]){if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('finance duplicate');for(const row of rows)if(!s.branches.some(x=>x.id===row.branch))throw Error('finance branch');}
 for(const p of b.purchases){if(!s.suppliers?.some(x=>x.id===p.supplier&&x.branch===p.branch)||p.lines.reduce((n,l)=>n+l.cost*l.quantity,0)!==p.total||supplierDue(s,p.id)<0)throw Error('purchase total/supplier');for(const l of p.lines){const lot=s.stockLots?.find(x=>x.id===l.lot&&x.branch===p.branch&&x.product===l.product&&x.supplier===p.supplier);if(!lot||lot.received!==l.quantity||lot.cost!==l.cost||lot.batch!==l.batch||lot.expires!==l.expires)throw Error('purchase lot');}}
 if(new Set(b.purchases.map(p=>p.branch+'|'+p.supplier+'|'+p.reference.toLocaleLowerCase())).size!==b.purchases.length)throw Error('purchase reference duplicate');
 for(const p of b.supplierPayments)if(!b.purchases.some(x=>x.id===p.purchase&&x.branch===p.branch))throw Error('supplier payment reference');
 for(const m of b.movements)if(m.shift&&!b.shifts.some(x=>x.id===m.shift&&x.branch===m.branch))throw Error('shift movement');
 const open=b.shifts.filter(x=>!x.closedAt);if(new Set(open.map(x=>x.branch)).size!==open.length)throw Error('open shift duplicate');
 for(const x of b.shifts)if(x.closedAt&&(x.closedAt<x.openedAt||x.actual===undefined||x.expected===undefined||x.difference!==x.actual-x.expected||x.expected!==shiftExpected(s,x.id)))throw Error('shift close');
}
export function financeBookOperation(s:GymState,op:Operation,today:string,now:string,actor:string,newId:()=>string){
 if(!op.type.startsWith('book.'))return false;const b=s.financeBook??=emptyFinanceBook();
 switch(op.type){
  case'book.expense.add':{const row=expense.parse({id:newId(),branch:op.branch,category:op.category,title:op.title,minor:op.minor,method:op.method,day:op.day,at:now,actor,voided:false,reason:''});if(row.day>today)throw new RuleError('dates');b.expenses.push(row);break;}
  case'book.expense.void':{if(s.hr?.payroll.some(x=>x.expense===op.id&&x.status==='paid'))throw new RuleError('transition');const x=b.expenses.find(x=>x.id===op.id&&x.branch===op.branch&&!x.voided);if(!x||typeof op.reason!=='string'||!op.reason.trim()||op.reason.length>500)throw new RuleError('invalid');x.voided=true;x.reason=op.reason.trim();break;}
  case'book.purchase.add':{
   if(!s.suppliers?.some(x=>x.id===op.supplier&&x.branch===op.branch&&!x.archived))throw new RuleError('notFound');
   const input=z.array(z.object({product:id,quantity:z.number().int().min(1).max(100000),cost:zero,batch:z.string().trim().min(1).max(150),expires:date}).strict()).min(1).max(50).parse(op.lines);
   const lines:z.infer<typeof purchase>['lines']=[];
   for(const l of input){shopOperation(s,{type:'shop.stock.receive',branch:op.branch,...l,supplier:op.supplier,document:op.reference},today,now,newId);const lot=s.stockLots!.at(-1)!;lines.push({...l,lot:lot.id,name:s.products!.find(p=>p.id===l.product)!.name});}
   const row=purchase.parse({id:newId(),branch:op.branch,supplier:op.supplier,reference:op.reference,due:op.due,at:now,lines,total:lines.reduce((n,l)=>n+l.cost*l.quantity,0)});
   if(row.due<today||b.purchases.some(p=>p.branch===op.branch&&p.supplier===row.supplier&&p.reference.toLocaleLowerCase()===row.reference.toLocaleLowerCase()))throw new RuleError('invalid');b.purchases.push(row);
   const paid=zero.parse(op.paid??0);if(paid>row.total)throw new RuleError('amount');if(paid)b.supplierPayments.push(payment.parse({id:newId(),branch:op.branch,purchase:row.id,minor:paid,method:op.method,at:now,actor}));break;
  }
  case'book.supplier.pay':{const p=b.purchases.find(x=>x.id===op.id&&x.branch===op.branch);if(!p)throw new RuleError('notFound');const row=payment.parse({id:newId(),branch:op.branch,purchase:p.id,minor:op.minor,method:op.method,at:now,actor});if(row.minor>supplierDue(s,p.id))throw new RuleError('amount');b.supplierPayments.push(row);break;}
  case'book.shift.open':{if(b.shifts.some(x=>x.branch===op.branch&&!x.closedAt))throw new RuleError('transition');b.shifts.push(shift.parse({id:newId(),branch:op.branch,opening:op.opening,openedAt:now,actor,note:''}));break;}
  case'book.shift.close':{const x=b.shifts.find(x=>x.id===op.id&&x.branch===op.branch&&!x.closedAt);if(!x)throw new RuleError('transition');const actual=zero.parse(op.actual),expected=shiftExpected(s,x.id),note=z.string().trim().max(500).parse(op.note??'');if(actual!==expected&&!note)throw new RuleError('invalid');Object.assign(x,{closedAt:now,closedBy:actor,actual,expected,difference:actual-expected,note});break;}
  default:throw new RuleError('invalid');
 }
 return true;
}
function cashFacts(s:GymState){const realMembers=new Set(s.members.filter(m=>!m.demo).map(m=>m.id));const facts=new Map<string,{minor:number;branch:string}>();const put=(key:string,minor:number,branch:string)=>{facts.set(key,{minor,branch});};
 for(const p of s.payments)if(p.method==='cash'&&realMembers.has(p.member))put('receipt:'+p.id,p.voided?0:p.minor,p.branch);
 for(const x of s.shopSales??[])if(x.method==='cash')put('sale:'+x.id,x.voided?0:x.total-(x.returns??[]).reduce((n,r)=>n+r.quantity*x.lines[r.line].price,0),x.branch);
 for(const x of s.coachPayouts??[])if(x.method==='cash')put('coach:'+x.id,-x.minor,x.branch);
 for(const x of s.financeBook?.expenses??[])if(x.method==='cash')put('expense:'+x.id,x.voided?0:-x.minor,x.branch);
 for(const x of s.financeBook?.supplierPayments??[])if(x.method==='cash')put('supplier:'+x.id,-x.minor,x.branch);
 return facts;
}
/** Append deltas at recording time, so later voids/returns never rewrite closed shifts. */
export function recordCashChanges(before:GymState,after:GymState,op:Operation,now:string,actor:string,newId:()=>string){
 const existing=new Set(before.financeBook?.movements.map(x=>x.id)??[]),recorded=new Map<string,number>();for(const x of after.financeBook?.movements??[])if(!existing.has(x.id))recorded.set(x.source,(recorded.get(x.source)??0)+x.minor);const old=cashFacts(before),next=cashFacts(after);for(const source of new Set([...old.keys(),...next.keys()])){const a=old.get(source),b=next.get(source),minor=(b?.minor??0)-(a?.minor??0)-(recorded.get(source)??0);if(!minor)continue;const branch=(b??a)!.branch,book=after.financeBook??=emptyFinanceBook(),open=book.shifts.find(x=>x.branch===branch&&!x.closedAt);book.movements.push(movement.parse({id:newId(),branch,...(open?{shift:open.id}:{}),source,minor,kind:op.type,at:now,actor}));}validateFinanceBook(after);
}
export function dailyBookOutflow(s:GymState,branch:string,on:string){return(s.financeBook?.expenses??[]).filter(x=>x.branch===branch&&!x.voided&&x.method==='cash'&&x.day===on).reduce((n,x)=>n+x.minor,0)+(s.financeBook?.supplierPayments??[]).filter(x=>x.branch===branch&&x.method==='cash'&&dayAt(x.at,s.settings.timezone)===on).reduce((n,x)=>n+x.minor,0);}
