import MemberApp from './member-app';
export const metadata={title:'GYM OS - تطبيق الأعضاء',manifest:'/member.webmanifest',appleWebApp:{capable:true,title:'GYM OS Members',statusBarStyle:'default'},icons:{apple:'/icons/icon-180.png'}};
export const viewport={themeColor:'#152340',viewportFit:'cover'};
export default async function MemberPage({searchParams}:{searchParams:Promise<{member?:string;club?:string}>}){const p=await searchParams;const staffRequest=typeof p.member==='string'&&typeof p.club==='string'?{member:p.member,club:p.club}:undefined;return <MemberApp key={staffRequest?staffRequest.club+':'+staffRequest.member:'member'} staffRequest={staffRequest}/>;}
