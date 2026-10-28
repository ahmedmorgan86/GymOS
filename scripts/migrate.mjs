import {getPool} from '../app/lib/database.ts';
import {readFile} from 'node:fs/promises';
import {assertFreshDatabase} from './migration-preflight.mjs';
if(!process.env.MIGRATION_DATABASE_URL)throw new Error('Set a separate administrative MIGRATION_DATABASE_URL securely before migration. The runtime login cannot alter schemas.');
process.env.DATABASE_URL=process.env.MIGRATION_DATABASE_URL;
const pool=getPool();const client=await pool.connect();
try{await assertFreshDatabase(client);await client.query('BEGIN');await client.query(await readFile(new URL('../db/postgres.sql',import.meta.url),'utf8'));await client.query(await readFile(new URL('../db/entities.sql',import.meta.url),'utf8'));await client.query(await readFile(new URL('../db/access-events.sql',import.meta.url),'utf8'));await client.query('COMMIT');console.log('GymEG base schema initialized. Commercial migrations must be installed separately. Supabase manages Auth tables.');}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();await pool.end();}
