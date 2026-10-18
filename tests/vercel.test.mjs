import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {postgresSQL} from '../app/lib/database.ts';
test('Postgres binds values and preserves revision checks',()=>{assert.equal(postgresSQL('UPDATE gym_states SET payload=?,revision=revision+1 WHERE user_id=? AND revision=?'),'UPDATE gymos.gym_states SET payload=$1,revision=revision+1 WHERE user_id=$2 AND revision=$3');});
test('Workspace creation is idempotent on PostgreSQL',()=>{assert.equal(postgresSQL('INSERT OR IGNORE INTO gym_states(user_id,payload) VALUES(?,?)'),'INSERT INTO gymos.gym_states(user_id,payload) VALUES($1,$2) ON CONFLICT DO NOTHING');});
test('Runtime entry points are independent of Cloudflare and header-based identity',async()=>{for(const path of ['app/lib/server-workspace.ts','app/api/workspace/route.ts','app/api/team/route.ts','app/api/backup/route.ts','app/chatgpt-auth.ts']){const code=await readFile(new URL('../'+path,import.meta.url),'utf8');assert.doesNotMatch(code,/cloudflare:workers|oai-authenticated-user/);}});
test('Vercel builds Next.js and uses .next output',async()=>{const p=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));const config=JSON.parse(await readFile(new URL('../vercel.json',import.meta.url),'utf8'));assert.equal(p.scripts.build,'next build --webpack');assert.equal(config.framework,'nextjs');assert.equal(config.outputDirectory,'.next');});
test('Login document cannot be cached as the authenticated offline shell',async()=>{const layout=await readFile(new URL('../app/layout.tsx',import.meta.url),'utf8');const home=await readFile(new URL('../app/page.tsx',import.meta.url),'utf8');assert.doesNotMatch(layout,/gymos-offline-shell/);assert.match(home,/gymos-offline-shell/);});
