'use client';
import {useState} from 'react';
import {clearClubBrand} from '../use-club-brand';
import {authClient} from '../lib/auth-client';
export default function Page(){const [error,setError]=useState(false);return <main className="auth-shell" dir="rtl"><section className="auth-card"><h1>تسجيل الخروج / Sign out</h1><button onClick={async()=>{try{await fetch('/api/commercial',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'support.stop'})});const result=await authClient.signOut();if(result.error)throw Error();clearClubBrand();location.assign(new URL('/sign-in',location.origin).href);}catch{setError(true);}}}>تأكيد تسجيل الخروج / Confirm sign out</button>{error&&<p role="alert">تعذر تسجيل الخروج. حاول مجددًا.</p>}</section></main>;}
