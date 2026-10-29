import type {Event} from './domain';
export function activityPage(archived:Event[],recent:Event[],branch:string,cursor?:{at:string;id:string},limit=201){
 const unique=new Map<string,Event>();
 for(const event of [...archived,...recent]){
  if(event.branch!==branch||!event.id||!event.at)continue;
  if(cursor&&(event.at>cursor.at||(event.at===cursor.at&&event.id>=cursor.id)))continue;
  if(!unique.has(event.id))unique.set(event.id,event);
 }
 return [...unique.values()].sort((a,b)=>b.at.localeCompare(a.at)||b.id.localeCompare(a.id)).slice(0,limit);
}
