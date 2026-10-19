import {test} from 'node:test';import assert from 'node:assert/strict';
import {musicLink,nextMusicIndex,validMusicFile,MUSIC_FILE_BYTES} from '../app/lib/music.ts';
test('Music accepts exact provider hosts, strips tracking and rejects executable URLs',()=>{
 for(const url of ['javascript:alert(1)','http://open.spotify.com/track/abc','https://open.spotify.com.evil.test/track/abc','https://user:pass@open.spotify.com/track/abc','https://open.spotify.com:444/track/abc','https://evil.test/x'])assert.equal(musicLink(url),null);
 const item=musicLink('https://open.spotify.com/playlist/abc123?si=secret',' Workout ');assert.equal(item.name,'Workout');assert.equal(item.url,'https://open.spotify.com/playlist/abc123');assert.equal(item.embed,'https://open.spotify.com/embed/playlist/abc123');
 assert.equal(musicLink('https://play.anghami.com/playlist/123').embed,undefined);
 assert.equal(musicLink('https://music.apple.com/us/album/test/123').platform,'Apple Music');
 assert.equal(musicLink('https://www.deezer.com/en/playlist/123').platform,'Deezer');assert.equal(musicLink('https://listen.tidal.com/playlist/123').platform,'TIDAL');
});
test('YouTube and SoundCloud embed URLs are built from validated identifiers',()=>{
 assert.equal(musicLink('https://music.youtube.com/watch?v=M7lc1UVf-VE&si=tracking').embed,'https://www.youtube.com/embed/M7lc1UVf-VE');
 assert.equal(musicLink('https://youtu.be/M7lc1UVf-VE').embed,'https://www.youtube.com/embed/M7lc1UVf-VE');
 assert.equal(musicLink('https://www.youtube.com/watch?v=bad').embed,undefined);
 assert.match(musicLink('https://soundcloud.com/artist/track').embed,/^https:\/\/w.soundcloud.com\/player\/\?url=https%3A%2F%2Fsoundcloud.com/);
 assert.equal(musicLink('https://youtube.com/playlist?list=PL12345678901').embed,'https://www.youtube.com/embed/videoseries?list=PL12345678901');
});
test('Local file validation bounds sizes and playlist shuffle excludes current track',()=>{
 assert.equal(validMusicFile({name:'test.mp3',size:100,type:'audio/mpeg'}),true);
 for(const file of [{name:'bad.exe',size:10,type:'audio/mpeg'},{name:'test.mp3',size:MUSIC_FILE_BYTES+1,type:'audio/mpeg'},{name:'x.wav',size:0,type:'audio/wav'},{name:'x.mp3',size:10,type:'text/html'}])assert.equal(validMusicFile(file),false);
 assert.equal(nextMusicIndex(2,3,false),0);assert.equal(nextMusicIndex(0,0,true),-1);assert.equal(nextMusicIndex(0,1,true),0);
 for(let index=0;index<4;index++)for(const random of [0,.25,.99,1])assert.notEqual(nextMusicIndex(index,4,true,random),index);
});
