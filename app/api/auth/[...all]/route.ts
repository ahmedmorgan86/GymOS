// Authentication is handled by Supabase Auth; the previous catch-all is retired.
export const GET=()=>Response.json({error:'notFound'},{status:404});
export const POST=GET;
