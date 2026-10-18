// Normalize the legacy cache variable before npm reads its environment.
import { spawnSync } from 'node:child_process';
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (key.toLowerCase() === 'npm_config_cache_dir') {
    if (!env.npm_config_cache && !env.NPM_CONFIG_CACHE) env.npm_config_cache = env[key];
    delete env[key];
  }
}
const args = process.argv.slice(2);
if (!(['ci', 'run'].includes(args[0])) || (args[0] === 'run' && args[1] !== 'build')) {
  throw new Error('Only ci and run build are supported');
}
const result = spawnSync('npm', args, { env, stdio: 'inherit', shell: process.platform === 'win32' });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
