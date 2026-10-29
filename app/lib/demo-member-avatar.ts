import type {Member} from './domain';
export function syntheticMember(member:Pick<Member,'id'|'demo'>){return member.demo||/^sample-full-member-\d+$/.test(member.id);}
export function demoMemberAvatarPath(member:Pick<Member,'id'|'demo'|'gender'|'name'>){
 if(!syntheticMember(member))return null;
 const female=member.gender==='female'||/^(?:سارة|منى|نور|مريم|دينا|هبة|سلمى|ليلى)(?:\s|$)|\b(?:Mariam|Nour|Salma|Laila)\b/i.test(member.name);
 const digits=member.id.match(/(\d+)$/)?.[1],hash=digits?Number(digits):[...member.id].reduce((value,char)=>value*31+char.charCodeAt(0),7);
 return `/demo-members/${female?'female':'male'}-${Math.abs(hash)%4+1}.jpg`;
}
