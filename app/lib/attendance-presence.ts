import type {GymState,Visit} from './domain.ts';
import {presentVisits} from './member-view.ts';
const MAX_OPEN_MS=12*3600000;
/** Visits store previous completed sessions plus the current/last session. */
export function visitTiming(visit:Visit,now:string){
 const currentStart=visit.activeAt??visit.at,stamp=Date.parse(now);
 const previous=(visit.sessions??[]).reduce((sum,s)=>sum+Math.max(0,Date.parse(s.leftAt)-Date.parse(s.at)),0);
 const end=visit.leftAt?Date.parse(visit.leftAt):Math.min(stamp,Date.parse(currentStart)+MAX_OPEN_MS);
 return{arrival:visit.at,currentArrival:currentStart,departure:visit.leftAt??null,expired:!visit.leftAt&&stamp-Date.parse(currentStart)>=MAX_OPEN_MS,durationMs:previous+Math.max(0,end-Date.parse(currentStart))};
}
export function currentAttendance(state:GymState,branch:string,now:string){
 const members=new Map(state.members.filter(m=>m.branch===branch&&!m.archived&&!m.demo).map(m=>[m.id,m]));
 return presentVisits(state,branch,now).filter(v=>members.has(v.member)).sort((a,b)=>(b.activeAt??b.at).localeCompare(a.activeAt??a.at)).map(visit=>({visit,member:members.get(visit.member)!,timing:visitTiming(visit,now)}));
}
export function durationLabel(milliseconds:number,ar:boolean){const minutes=Math.floor(Math.max(0,milliseconds)/60000),hours=Math.floor(minutes/60);return hours?(ar?`${hours} س ${minutes%60} د`:`${hours}h ${minutes%60}m`):(ar?`${minutes} دقيقة`:`${minutes} min`);}
