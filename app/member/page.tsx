import MemberApp from './member-app';
export const metadata={title:'GYMEG - تطبيق الأعضاء',manifest:'/member.webmanifest',appleWebApp:{capable:true,title:'GYMEG Members',statusBarStyle:'default'},icons:{apple:'/icons/icon-180.png?v=20261028-gymeg'}};
export const viewport={themeColor:'#7C3AED',viewportFit:'cover'};
export default async function MemberPage({searchParams}:{searchParams:Promise<{member?:string;club?:string}>}){const p=await searchParams;const staffRequest=typeof p.member==='string'&&typeof p.club==='string'?{member:p.member,club:p.club}:undefined;return <MemberApp key={staffRequest?staffRequest.club+':'+staffRequest.member:'member'} staffRequest={staffRequest}/>;}
