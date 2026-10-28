import {test} from 'node:test';import assert from 'node:assert/strict';
import {hasLocalMatch} from 'next/dist/shared/lib/match-local-pattern.js';
import config from '../next.config.ts';
test('Image optimizer accepts current/previous brand icons without allowing arbitrary query strings',()=>{
 for(const version of ['20261027','20261028-gymeg','20261029-gymeg','20261029-gymeg-r2'])for(const asset of ['/icons/brand-main.svg','/images/app-overview-private.webp'])assert.equal(hasLocalMatch(config.images.localPatterns,asset+'?v='+version),true,asset+' '+version);
 assert.equal(hasLocalMatch(config.images.localPatterns,'/icons/icon-192.png'),true);
 for(const path of ['/icons/icon-192.png?v=unreviewed','/api/member-photo?member=other','/images/photo.webp?url=https://evil.invalid'])assert.equal(hasLocalMatch(config.images.localPatterns,path),false,path);
});
