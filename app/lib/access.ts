export type Role='owner'|'manager'|'reception';
export type AttendanceGrant={user:string;branch:string};
export function permitted(role:Role,type:string,attendance=false,booking=false){
 if(type==='access.attendance'||type==='access.booking')return role==='owner';
 return role==='owner'||role==='manager'||(role==='reception'&&((attendance&&['visit.add','visit.scan','visit.exit'].includes(type))||(booking&&type==='class.book')));
}
export function attendanceGranted(grants:AttendanceGrant[]|undefined,user:string,branch:string){return grants?.some(g=>g.user===user&&g.branch===branch)??false;}
export function fullAdministration(role:Role,scope:string[]|null,branches:string[]){return role==='owner'||(role==='manager'&&Array.isArray(scope)&&branches.every(id=>scope.includes(id)));}
