import MemberApp from './member-app';
export const metadata={title:'GymEG - تطبيق الأعضاء',manifest:'/member.webmanifest',appleWebApp:{capable:true,title:'GymEG Members',statusBarStyle:'default'},icons:{icon:'/icons/members-192.png?v=20261030-role-icons',apple:'/icons/members-180.png?v=20261030-role-icons'}};
export const viewport={themeColor:'#7C3AED',viewportFit:'cover'};
export default function Page(){return <MemberApp/>;}
