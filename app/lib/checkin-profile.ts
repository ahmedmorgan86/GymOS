import type {GymState} from './domain.ts';
/** Only newly confirmed, recent entries in the currently visible branch open a profile. */
export function checkinProfile(previous:GymState|null,next:GymState,branch:string,now:number):string|null{
 if(!previous||(previous.generation??'v1')!==(next.generation??'v1'))return null;
 const before=new Map(previous.visits.map(v=>[v.id,v.activeAt??v.at])),members=new Set(next.members.filter(m=>m.branch===branch&&!m.archived).map(m=>m.id));
 const entries=next.visits.filter(v=>v.branch===branch&&!v.leftAt&&before.get(v.id)!==(v.activeAt??v.at)&&Date.parse(v.activeAt??v.at)<=now+60000&&Date.parse(v.activeAt??v.at)>=now-120000&&members.has(v.member));
 entries.sort((a,b)=>Date.parse(b.activeAt??b.at)-Date.parse(a.activeAt??a.at));return entries[0]?.member??null;
}
