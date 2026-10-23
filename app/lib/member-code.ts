import {createHash,randomBytes} from 'node:crypto';
export const memberCookie='gymos_member';
export function normalizeMemberCode(value:unknown){if(typeof value!=='string'||value.length>100)return null;const code=value.trim().replace(/\s/g,'').toUpperCase();return /^GM-[A-F0-9]{32}$/.test(code)?code:null;}
export const memberCodeHash=(value:string)=>createHash('sha256').update(value).digest('hex');
export const newMemberCode=()=> 'GM-'+randomBytes(16).toString('hex').toUpperCase();
export function memberSessionToken(request:Request){return request.headers.get('cookie')?.match(/(?:^|;\s*)gymos_member=([a-f0-9]{64})(?:;|$)/)?.[1]??null;}
