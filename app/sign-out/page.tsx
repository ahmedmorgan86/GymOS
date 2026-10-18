'use client';
import {useState} from 'react';
import {authClient} from '../lib/auth-client';
export default function Page(){const [error,setError]=useState(false);return <main className="auth-shell" dir="rtl"><section className="auth-card"><h1>تسجيل الخروج / Sign out</h1><button onClick={async()=>{try{const result=await authClient.signOut();if(result.error)throw Error();location.href='/sign-in';}catch{setError(true);}}}>تأكيد تسجيل الخروج / Confirm sign out</button>{error&&<p role="alert">تعذر تسجيل الخروج. حاول مجددًا.</p>}</section></main>;}
