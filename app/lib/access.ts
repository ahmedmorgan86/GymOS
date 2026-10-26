export type Role='owner'|'manager'|'reception';
export function permitted(role:Role,_type:string){if(['design.save','card.restore','reception.settings','reception.permissions'].includes(_type))return role==='owner';return role==='owner'||role==='manager';}
export function fullAdministration(role:Role,scope:string[]|null,branches:string[]){return role==='owner'||(role==='manager'&&Array.isArray(scope)&&branches.every(id=>scope.includes(id)));}

export function receptionPermitted(role:Role,type:string,grants:string[]=[]){return permitted(role,type)||role==='manager'&&type==='card.restore'&&grants.includes(type)||role==='reception'&&['member.register','member.details','visit.add','visit.scan','visit.exit','payment.add','invoice.pay','card.replace','card.serial'].includes(type)&&grants.includes(type);}
