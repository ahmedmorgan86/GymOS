import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {hiddenMusicIds,visibleDefaultMusic} from '../app/lib/default-music.ts';
const catalog=JSON.parse(readFileSync(new URL('../public/music/default-catalog.json',import.meta.url)));
test('Bundled music consists of complete, licensed files matching their published checksums',()=>{
 assert.equal(catalog.tracks.length,20);
 assert.equal(new Set(catalog.tracks.map(t=>t.id)).size,20);
 for(const t of catalog.tracks){
  assert.equal(t.license,'CC0-1.0');
  assert.match(t.source,/^https:\/\/opengameart\.org\/content\//);
  assert.ok(t.durationSeconds>=90);
  assert.match(t.url,/^\/music\/defaults\/[^/]+\.mp3$/);
  const bytes=readFileSync(new URL('../public'+t.url,import.meta.url));
  assert.equal(bytes.length,t.bytes);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),t.sha256);
 }
});
test('Default track hiding is bounded, validates known IDs and restores without altering the catalog',()=>{
 const id=catalog.tracks[0].id;
 assert.deepEqual(hiddenMusicIds(JSON.stringify([id,id,'unknown',null,{}])),[id]);
 assert.equal(visibleDefaultMusic(JSON.stringify([id])).length,19);
 assert.equal(visibleDefaultMusic('[]').length,20);
 assert.deepEqual(hiddenMusicIds('{invalid'),[]);
 assert.deepEqual(hiddenMusicIds('{}'),[]);
});
