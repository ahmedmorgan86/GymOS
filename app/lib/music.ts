export type MusicLink={name:string;url:string;platform:string;embed?:string};
export const musicPlatforms=[
 {name:'Spotify',url:'https://open.spotify.com/'},
 {name:'Anghami',url:'https://play.anghami.com/'},
 {name:'YouTube Music',url:'https://music.youtube.com/'},
 {name:'YouTube',url:'https://www.youtube.com/'},
 {name:'SoundCloud',url:'https://soundcloud.com/'},
 {name:'Apple Music',url:'https://music.apple.com/'},
 {name:'Deezer',url:'https://www.deezer.com/'},
 {name:'TIDAL',url:'https://listen.tidal.com/'},
] as const;
// Only canonical HTTPS provider URLs are accepted; never accept iframe HTML.
export function musicLink(raw:string,name=''):MusicLink|null{
 try{
  const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port||raw.length>2000)return null;
  const host=u.hostname.toLowerCase(),path=u.pathname;
  let platform='',embed:string|undefined;
  if(host==='open.spotify.com'){
   platform='Spotify';const match=path.match(/^\/(?:intl-[a-z]+\/)?(track|album|playlist|artist|episode|show)\/([a-zA-Z0-9]+)\/?$/);
   if(match)embed=`https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }else if(['www.youtube.com','youtube.com','music.youtube.com','youtu.be'].includes(host)){
   platform=host==='music.youtube.com'?'YouTube Music':'YouTube';
   const video=host==='youtu.be'?path.slice(1):u.searchParams.get('v');const list=u.searchParams.get('list');
   if(video&&/^[\w-]{11}$/.test(video))embed='https://www.youtube.com/embed/'+video;
   else if(list&&/^[\w-]{10,100}$/.test(list))embed='https://www.youtube.com/embed/videoseries?list='+list;
  }else if(host==='soundcloud.com'||host==='www.soundcloud.com'){
   platform='SoundCloud';if(path.split('/').filter(Boolean).length>=2)embed='https://w.soundcloud.com/player/?url='+encodeURIComponent('https://soundcloud.com'+path)+'&auto_play=false';
  }else if(['play.anghami.com','mobile.anghami.com','www.anghami.com','anghami.com','widget.anghami.com'].includes(host)){
   platform='Anghami';const match=path.match(/^\/(song|album|playlist|artist)\/(\d+)\/?$/);if(match)embed=`https://widget.anghami.com/${match[1]}/${match[2]}/?theme=fulldark&layout=list&lang=ar`;
  }else if(host==='music.apple.com'||host==='embed.music.apple.com'){
   platform='Apple Music';if(/^\/[a-z]{2}\/(album|playlist|song|music-video)\/[^/]+\/[\w.-]+\/?$/i.test(path)){const target=new URL('https://embed.music.apple.com'+path);const song=u.searchParams.get('i');if(song&&/^\d+$/.test(song))target.searchParams.set('i',song);embed=target.href;}
  }else if(host==='deezer.com'||host==='www.deezer.com'||host==='widget.deezer.com'){
   platform='Deezer';const match=path.match(/^\/(?:[a-z]{2}\/|widget\/(?:auto|dark|light)\/)?(track|album|playlist|artist|show|episode)\/(\d+)\/?$/);if(match)embed=`https://widget.deezer.com/widget/auto/${match[1]}/${match[2]}`;
  }else if(['listen.tidal.com','tidal.com','www.tidal.com','embed.tidal.com'].includes(host)){
   platform='TIDAL';const match=path.match(/^\/(?:browse\/)?(track|album|video|playlist)s?\/([\w-]+)\/?$/);if(match)embed=`https://embed.tidal.com/${match[1]}s/${match[2]}`;
  }
  else return null;
  // Strip tracking and fragments; retain only content identifiers for YouTube.
  const clean=new URL('https://'+host+path);if(platform==='Anghami')clean.hostname='play.anghami.com';if(platform==='Apple Music')clean.hostname='music.apple.com';if(platform==='Deezer'){clean.hostname='www.deezer.com';clean.pathname=path.replace(/^\/widget\/(?:auto|dark|light)\//,'/');}if(platform==='TIDAL'){clean.hostname='listen.tidal.com';clean.pathname=path.replace(/^\/browse\//,'/').replace(/^\/(track|album|video|playlist)s\//,'/$1/');}if(platform.startsWith('YouTube'))for(const key of ['v','list']){const value=u.searchParams.get(key);if(value)clean.searchParams.set(key,value);}
  if(platform==='Apple Music'){const song=u.searchParams.get('i');if(song&&/^\d+$/.test(song))clean.searchParams.set('i',song);}
  return {name:name.trim().slice(0,100)||platform,url:clean.href,platform,...(embed?{embed}:{})};
 }catch{return null;}
}
export const MUSIC_MAX_BYTES=250*1024*1024,MUSIC_FILE_BYTES=25*1024*1024;
export function validMusicFile(file:{name:string;size:number;type:string}){return file.size>0&&file.size<=MUSIC_FILE_BYTES&&/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i.test(file.name)&&(!file.type||file.type.startsWith('audio/')||file.type==='video/webm');}
export function nextMusicIndex(index:number,count:number,shuffle:boolean,random=Math.random()){if(count<1)return -1;if(count===1)return 0;if(!shuffle)return (index+1)%count;const slot=Math.min(count-2,Math.max(0,Math.floor(random*(count-1))));return slot>=index?slot+1:slot;}

export function musicPlaybackTarget(link:MusicLink,nativeReady:boolean){return nativeReady?{mode:'native' as const,url:link.url}:{mode:'embed' as const,url:link.embed};}
