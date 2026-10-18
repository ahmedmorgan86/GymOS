import {NextResponse} from 'next/server';
import {serverAuth} from '../../lib/auth';
export async function GET(request:Request){const url=new URL(request.url),code=url.searchParams.get('code');if(code){const supabase=await serverAuth();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(url.searchParams.get('next')==='/reset-password'?'/reset-password':'/',url.origin));}return NextResponse.redirect(new URL('/sign-in?error=confirmation',url.origin));}
