import catalog from '../../public/music/default-catalog.json' with {type:'json'};
export type BundledTrack={id:string;title:string;artist:string;url:string;bytes:number;sha256:string;source:string;sourceFile:string;license:string;licenseUrl:string;verifiedOn:string;category:string;durationSeconds:number};
export const defaultMusic:BundledTrack[]=catalog.tracks;
export function hiddenMusicIds(raw:string){try{const value=JSON.parse(raw);return Array.isArray(value)?[...new Set(value.filter((x):x is string=>typeof x==='string'&&defaultMusic.some(t=>t.id===x)))].slice(0,100):[];}catch{return[];}}
export function visibleDefaultMusic(raw:string){const hidden=new Set(hiddenMusicIds(raw));return defaultMusic.filter(x=>!hidden.has(x.id));}
