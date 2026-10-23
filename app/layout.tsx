import type { Metadata,Viewport } from "next";
import "./globals.css";
export const metadata:Metadata={robots:{index:false,follow:false},verification:{google:process.env.GOOGLE_SITE_VERIFICATION,yandex:process.env.YANDEX_SITE_VERIFICATION,other:{...(process.env.BING_SITE_VERIFICATION?{"msvalidate.01":process.env.BING_SITE_VERIFICATION}:{})}},title:"GYM OS — Your club, in rhythm",description:"مساحة ناديك لإدارة الأعضاء والحضور والتجديد والتحصيل، مع Gym Pulse.",manifest:"/manifest.webmanifest",icons:{icon:[{url:"/favicon.ico",sizes:"any"},{url:"/favicon.svg",type:"image/svg+xml"}],apple:"/icons/icon-180.png"}};
export const viewport:Viewport={themeColor:"#7955f6"};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
