import Image from 'next/image';
import type {Member} from './lib/domain';
import {demoMemberAvatarPath,syntheticMember} from './lib/demo-member-avatar';
export default function MemberAvatar({member,size=60,ar=true,className='',fallbackClassName=''}:{member:Member;size?:number;ar?:boolean;className?:string;fallbackClassName?:string}){
 const demoPhoto=demoMemberAvatarPath(member);
 if(member.photo||demoPhoto)return <Image src={member.photo??demoPhoto!} width={size} height={size} alt={demoPhoto?(ar?'صورة توضيحية لعضو تجريبي':'Illustrative demo member portrait'):(ar?'صورة العضو':'Member photo')} unoptimized className={className} style={{borderRadius:'50%',objectFit:'cover'}}/>;
 if(!syntheticMember(member))return <span className={fallbackClassName} style={{width:size,height:size}} aria-label={ar?'لا توجد صورة':'No photo'}>{member.name[0]}</span>;
 return null;
}
