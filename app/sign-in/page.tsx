import Login from './login';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;return <Login initialSignup={query.register==='1'}/>;}
