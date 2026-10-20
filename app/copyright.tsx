'use client';
import {useSyncExternalStore} from 'react';
const year=()=>new Date().getFullYear();
const subscribe=(notify:()=>void)=>{const timer=setInterval(notify,60000);return()=>clearInterval(timer);};
export default function Copyright(){const current=useSyncExternalStore(subscribe,year,year);return <span className="ownership-credit" dir="ltr">© Ahmed Morgan {current}</span>;}
