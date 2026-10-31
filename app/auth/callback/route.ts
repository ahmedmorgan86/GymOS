import {NextResponse} from 'next/server';
import {serverAuth} from '../../lib/auth';
const SAFE_DESTINATIONS = new Set(['/reset-password', '/member', '/clubs']);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const destination = SAFE_DESTINATIONS.has(url.searchParams.get('next') ?? '')
    ? url.searchParams.get('next')!
    : '/clubs';

  if (code) {
    const supabase = await serverAuth();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destination, url.origin));
  }

  return NextResponse.redirect(new URL('/sign-in?error=confirmation', url.origin));
}
