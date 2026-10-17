import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"GYM OS — Your club, in rhythm",description:"مساحة ناديك لإدارة الأعضاء والحضور والتجديد والتحصيل، مع Gym Pulse.",other:{"gymos-offline-shell":"1"},icons:{icon:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="ar" dir="rtl"><body>{children}</body></html>;}
