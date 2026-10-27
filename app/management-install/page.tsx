import MobileInstallGuide from '../mobile-install-guide';
export const metadata={title:'PUSHTORQ — تثبيت التطبيق',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{lang?:string}>}){const {lang}=await searchParams;return <MobileInstallGuide kind='management' en={lang==='en'}/>;}
