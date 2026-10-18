'use client';
import {createBrowserClient} from '@supabase/ssr';
function browserAuth(){return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);}
export const authClient={signIn:{email:({email,password}:{email:string;password:string})=>browserAuth().auth.signInWithPassword({email,password})},signUp:{email:({email,password,name}:{email:string;password:string;name:string})=>browserAuth().auth.signUp({email,password,options:{data:{name},emailRedirectTo:location.origin+'/auth/callback'}})},signOut:()=>browserAuth().auth.signOut({scope:'local'})};
