import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {validBrandLogo} from './branding.ts';
import type {FullReport} from './full-report.ts';
import type {Cell,Sheet} from 'write-excel-file/node';
export async function reportWorkbook(report:FullReport,ar:boolean){
 const {default:writeExcel}=await import('write-excel-file/node'),{default:sharp}=await import('sharp');
 const fallback=()=>readFile(join(process.cwd(),'public/icons/icon-512.png'));
 let logo:Buffer;try{logo=await sharp(validBrandLogo(report.logo)?Buffer.from(report.logo.slice(22),'base64'):await fallback(),{limitInputPixels:16777216}).resize(160,160,{fit:'contain',background:{r:255,g:255,b:255,alpha:1}}).png().toBuffer();}catch{logo=await fallback();}
 const accent=/^#[a-f0-9]{6}$/i.test(report.accent)?report.accent:'#7C3AED';
 const sheets:Sheet<Buffer>[] =report.tables.map((table,index)=>{const width=Math.max(2,table.headers.length),data:Cell[][]=[];
 data.push([{value:'',height:66,backgroundColor:'#FFFFFF'},{value:report.gym+' — '+table.title,columnSpan:width-1,fontSize:16,fontWeight:'bold',height:66,wrap:true,textColor:'#FFFFFF',backgroundColor:'#211636'}]);
 data.push([{value:report.from+' → '+report.to+' | '+report.currency+' | '+report.branches.join(' / '),columnSpan:width,height:30,wrap:true,backgroundColor:'#F5F3FF',textColor:'#273B61'}]);
 data.push([{value:(ar?'تاريخ الإصدار: ':'Generated: ')+report.generatedAt+' | '+report.timezone,columnSpan:width,height:26,textColor:'#59647A',wrap:true}]);
 data.push([{value:report.notes,columnSpan:width,height:90,wrap:true,backgroundColor:'#F4F6FB'}]);data.push([]);
 data.push(table.headers.map(value=>({value,fontWeight:'bold',textColor:'#FFFFFF',backgroundColor:'#3B1C63',height:36,wrap:true,borderBottomColor:accent,borderBottomStyle:'medium'})));
 const integerHeader=(index:number)=>/(?:دقائق|الدقائق|جلسات|عدد|سعة|زيارات|Days|Minutes|Sessions|Capacity|Quantity|Units|Rank|Sets|Reps)/i.test(table.headers[index]);
 for(const[i,row]of table.rows.entries())data.push(row.map((value,column)=>({value:value??'',wrap:true,alignVertical:'top',backgroundColor:i%2?'#F5F3FF':'#FFFFFF',textColor:'#232B40',...(typeof value==='number'?{format:integerHeader(column)?'#,##0':'#,##0.00;[Red]-#,##0.00'}:{})})));
 data.push([{value:'© Ahmed Morgan '+new Date(report.generatedAt).getUTCFullYear()+' · GymEG',columnSpan:width,height:26,textColor:'#69748A'}]);
 return{data,sheet:String(index+1).padStart(2,'0')+' '+table.title.replace(/[\\/?*:[\]]/g,' ').slice(0,27),images:[{content:logo,contentType:'image/png',width:64,height:64,dpi:96,anchor:{row:1,column:1},offsetX:8,offsetY:10,title:report.gym}],rightToLeft:ar,stickyRowsCount:6,orientation:'landscape',showGridLines:false,columns:table.headers.map((_,i)=>({width:width===2?(i===0?58:70):i===0?30:25}))};});
 return writeExcel(sheets,{fontFamily:'Cairo',fontSize:11});
}
