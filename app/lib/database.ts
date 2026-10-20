import {Pool,type PoolClient} from 'pg';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {rootCertificates} from 'node:tls';
let pool:Pool|undefined;
export function getPool(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required');
 const url=new URL(process.env.DATABASE_URL);for(const param of ['sslmode','sslrootcert','sslcert','sslkey'])url.searchParams.delete(param);
 if(!pool){pool=new Pool({connectionString:url.href,ssl:{rejectUnauthorized:true,ca:[...rootCertificates,readFileSync(join(process.cwd(),'certs','supabase-ca.crt'),'utf8')]},max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,statement_timeout:30000,query_timeout:45000});pool.on('error',()=>console.error('Database connection lost'));pool.on('connect',client=>client.on('error',()=>{}));}return pool;
}
export function postgresSQL(query:string){let index=0;const ignore=/^INSERT OR IGNORE /i.test(query);let sql=query.replace(/\bgym_(states|access|invites|recovery)\b/g,'gymos.gym_$1').replace(/^INSERT OR IGNORE /i,'INSERT ').replace(/\?/g,()=>'$'+(++index));if(ignore)sql+=' ON CONFLICT DO NOTHING';return sql;}
export async function withScope<T>(owner:string,work:(client:PoolClient)=>Promise<T>){const client=await getPool().connect();try{await client.query('BEGIN');await client.query("SELECT set_config('app.gym_owner',$1,true)",[owner]);const result=await work(client);await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}
class Statement{
 readonly sql:string;readonly values:unknown[];
 constructor(sql:string,values:unknown[]=[]){this.sql=sql;this.values=values;}
 bind(...values:unknown[]){return new Statement(this.sql,values);}
 async execute(client:Pool|PoolClient=getPool()){return client.query(postgresSQL(this.sql),this.values);}
 async first<T>(owner?:string){const result=owner?await withScope(owner,client=>this.execute(client)):await this.execute();return result.rows[0] as T|null??null;}
 async all(owner?:string){const result=owner?await withScope(owner,client=>this.execute(client)):await this.execute();return {results:result.rows};}
 async run(owner?:string){const result=owner?await withScope(owner,client=>this.execute(client)):await this.execute();return {meta:{changes:result.rowCount??0}};}
}
export const db={prepare:(sql:string)=>new Statement(sql),async batch(statements:Statement[],owner?:string){const client=await getPool().connect();try{await client.query('BEGIN');if(owner)await client.query("SELECT set_config('app.gym_owner',$1,true)",[owner]);await client.query("SELECT pg_advisory_xact_lock(724396173)");const result=[];for(const statement of statements){const row=await statement.execute(client);result.push({meta:{changes:row.rowCount??0},results:row.rows});}await client.query('COMMIT');return result;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}}};
