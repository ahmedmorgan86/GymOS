import type { Metadata,Viewport } from "next";
import "./globals.css";
import "./pushtorq-design.css";
export const metadata:Metadata={applicationName:"PUSHTORQ",appleWebApp:{capable:true,title:"PUSHTORQ",statusBarStyle:"black-translucent"},robots:{index:false,follow:false},verification:{google:process.env.GOOGLE_SITE_VERIFICATION,yandex:process.env.YANDEX_SITE_VERIFICATION,other:{...(process.env.BING_SITE_VERIFICATION?{"msvalidate.01":process.env.BING_SITE_VERIFICATION}:{})}},title:"PUSHTORQ — POWER YOUR GYM",description:"مساحة ناديك لإدارة الأعضاء والحضور والتجديد والتحصيل، مع PUSHTORQ Pulse.",manifest:"/manifest.webmanifest",icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/favicon.svg?v=20261027",type:"image/svg+xml"}],apple:"/icons/icon-180.png?v=20261027"}};
export const viewport:Viewport={themeColor:"#7C3AED"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
