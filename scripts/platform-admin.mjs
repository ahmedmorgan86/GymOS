// Administrative bootstrap only. Never run with the application's limited login.
import {getPool} from '../app/lib/database.ts';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!email.includes('@'))throw Error('Provide the confirmed platform administrator email.');
if(!process.env.MIGRATION_DATABASE_URL)throw Error('A separate administrative MIGRATION_DATABASE_URL is required.');
process.env.DATABASE_URL=process.env.MIGRATION_DATABASE_URL;
const pool=getPool(),client=await pool.connect();
try{await client.query('BEGIN');const account=(await client.query('SELECT id::text FROM auth.users WHERE lower(email)=$1 AND email_confirmed_at IS NOT NULL',[email])).rows;if(account.length!==1)throw Error('Exactly one confirmed account is required.');await client.query('INSERT INTO gymos.platform_admins(user_id) VALUES($1) ON CONFLICT DO NOTHING',[account[0].id]);await client.query('COMMIT');console.log('Confirmed account assigned platform administration.');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();await pool.end();}
