export type Role='owner'|'manager'|'reception';
export function permitted(role:Role,_type:string){if(_type==='design.save')return role==='owner';return role==='owner'||role==='manager';}
export function fullAdministration(role:Role,scope:string[]|null,branches:string[]){return role==='owner'||(role==='manager'&&Array.isArray(scope)&&branches.every(id=>scope.includes(id)));}
