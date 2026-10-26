// Stable, verified platform-owner identity. Never trust a browser-supplied email or flag.
export const PLATFORM_OWNER_ACCOUNT_ID='fbf6cf7d-0c30-487e-93b7-a2b772e524c8';
export const OWNER_FREE_PLAN='platform-owner-free';
export const OWNER_FREE_LIMITS={branches:100,members:10000,staff:1000};
export function ownerComplimentary(platform:boolean,userId:string){return platform&&userId===PLATFORM_OWNER_ACCOUNT_ID;}
