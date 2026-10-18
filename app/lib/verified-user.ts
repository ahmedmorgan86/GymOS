export type VerifiedUser={userId:string;displayName:string;email:string;fullName:string|null};
type AuthUser={id:string;email?:string;is_anonymous?:boolean;user_metadata?:Record<string,unknown>};
type Auth={getUser:()=>Promise<{data:{user:AuthUser|null};error:unknown}>};
// getUser verifies the token with Supabase Auth on every protected request.
export async function verifiedUser(auth:Auth):Promise<VerifiedUser|null>{const {data,error}=await auth.getUser();if(error||!data.user||data.user.is_anonymous)return null;const user=data.user;const name=typeof user.user_metadata?.name==='string'?user.user_metadata.name.slice(0,150):null;return{userId:user.id,displayName:name||user.email||'Member',email:user.email??'',fullName:name};}
