import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {hiddenMusicIds,visibleDefaultMusic} from '../app/lib/default-music.ts';
const catalog=JSON.parse(readFileSync(new URL('../public/music/default-catalog.json',import.meta.url)));
test('Retired bundled music catalog is empty and no shipped audio files remain',()=>{assert.deepEqual(catalog.tracks,[]);const folder=new URL('../public/music/defaults/',import.meta.url);assert.deepEqual(existsSync(folder)?readdirSync(folder).filter(x=>/\.mp3$/i.test(x)):[],[]);});
test('Stale device references cannot restore retired bundled tracks',()=>{assert.deepEqual(hiddenMusicIds('["gymos-default-silver-bullet"]'),[]);assert.deepEqual(visibleDefaultMusic('[]'),[]);assert.deepEqual(hiddenMusicIds('{invalid'),[]);});
