export function staffAccess(value:unknown,branches:string[],owner:string){
 const v=value as Record<string,unknown>|null;
 if(!v||typeof v.user!=='string'||!v.user||v.user.length>250||v.user===owner||!['manager','reception'].includes(String(v.role))||typeof v.name!=='string'||!v.name.trim()||v.name.trim().length>150||!Array.isArray(v.branches)||!v.branches.length||v.branches.length>100||new Set(v.branches).size!==v.branches.length||!v.branches.every(id=>typeof id==='string'&&branches.includes(id)))return null;
 return{user:v.user,name:v.name.trim(),role:String(v.role),branches:v.branches as string[]};
}
