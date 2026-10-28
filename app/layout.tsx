import type { Metadata,Viewport } from "next";
import "./globals.css";
import "./gymeg-design.css";
export const metadata:Metadata={applicationName:"GYMEG",appleWebApp:{capable:true,title:"GYMEG",statusBarStyle:"black-translucent"},robots:{index:false,follow:false},verification:{google:process.env.GOOGLE_SITE_VERIFICATION,yandex:process.env.YANDEX_SITE_VERIFICATION,other:{...(process.env.BING_SITE_VERIFICATION?{"msvalidate.01":process.env.BING_SITE_VERIFICATION}:{})}},title:"GYMEG — YOUR GYM. ONE SYSTEM.",description:"مساحة ناديك لإدارة الأعضاء والحضور والتجديد والتحصيل، مع GYMEG Pulse.",manifest:"/manifest.webmanifest",icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/favicon.svg?v=20261028-gymeg",type:"image/svg+xml"}],apple:"/icons/icon-180.png?v=20261028-gymeg"}};
export const viewport:Viewport={themeColor:"#7C3AED"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
