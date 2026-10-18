export function loginCode(error:{code?:string;status?:number;name?:string}|null|undefined){
 if(error?.status===429)return 'rate_limit';
 if(error?.code==='invalid_credentials')return 'invalid_credentials';
 if(error?.code==='email_not_confirmed')return 'email_not_confirmed';
 if(error?.name==='AuthRetryableFetchError'||(error?.status??0)>=500)return 'connection';
 return 'auth_failed';
}
export function loginMessage(code:string,ar:boolean){const messages:Record<string,[string,string]>={invalid_credentials:['البريد أو كلمة المرور غير مطابقين. راجع لغة لوحة المفاتيح ويمكنك إظهار كلمة المرور للتحقق.','Email or password did not match. Check keyboard language and use Show password to verify.'],email_not_confirmed:['أكد بريدك الإلكتروني أولًا من رسالة التسجيل.','Confirm your email using the registration email first.'],rate_limit:['محاولات كثيرة. انتظر قليلًا ثم أعد المحاولة.','Too many attempts. Wait before trying again.'],connection:['تعذر الوصول لخدمة الدخول. تحقق من اتصال الإنترنت وحاول مجددًا.','Cannot reach the sign-in service. Check your connection and retry.'],auth_failed:['تعذر إتمام الدخول. أرسل رمز التشخيص فقط لمسؤول النادي.','Unable to sign in. Share only the diagnostic code with your administrator.']};return (messages[code]??messages.auth_failed)[ar?0:1];}
export function loginCredentials(value:unknown){const v=value as Record<string,unknown>|null;if(!v||typeof v.email!=='string'||typeof v.password!=='string')return null;const email=v.email.trim();if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||!v.password.length||v.password.length>128)return null;return{email,password:v.password};}
