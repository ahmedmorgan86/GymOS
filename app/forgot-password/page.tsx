import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {redirectAuthFlow} from '../lib/auth-flow-origin';
import PasswordForm from '../password-form';
export default async function ForgotPassword(){const origin=redirectAuthFlow((await headers()).get('host'));if(origin)redirect(origin+'/forgot-password');return <PasswordForm/>;}
