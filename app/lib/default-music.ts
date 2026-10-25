import catalog from '../../public/music/default-catalog.json' with {type:'json'};
export const defaultMusic=catalog.tracks;
export function hiddenMusicIds(raw:string){try{const value=JSON.parse(raw);return Array.isArray(value)?[...new Set(value.filter((x):x is string=>typeof x==='string'&&defaultMusic.some(t=>t.id===x)))].slice(0,100):[];}catch{return[];}}
export function visibleDefaultMusic(raw:string){const hidden=new Set(hiddenMusicIds(raw));return defaultMusic.filter(x=>!hidden.has(x.id));}
