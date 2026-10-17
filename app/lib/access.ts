export type Role='owner'|'manager'|'reception';
const reception=new Set(['visit.add','visit.scan','visit.offline','class.book']);
export function permitted(role:Role,type:string){if(role==='owner')return true;if(role==='reception')return reception.has(type);return !['settings.save','logo.set','branch.add','demo.seed','demo.clear','backup.restore'].includes(type);}
