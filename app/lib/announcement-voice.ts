export type AnnouncementVoice=Pick<SpeechSynthesisVoice,'voiceURI'|'name'|'lang'>;
export function announcementVoiceLabel(voice:AnnouncementVoice,ar:boolean){
 const locale=voice.lang.toLowerCase();
 if(locale==='ar-eg')return `${voice.name} · ${ar?'مصري':'Egyptian Arabic'}`;
 if(locale.startsWith('ar'))return `${voice.name} · ${ar?'عربي':'Arabic'}`;
 return `${voice.name} · ${voice.lang}`;
}
export function announcementVoiceSample(voice:AnnouncementVoice){
 return voice.lang.toLowerCase()==='ar-eg'
  ?'إزيكم يا أبطال، التمرين هيبدأ كمان شوية. ياريت كل واحد يجهز نفسه.'
  :'أَهْلًا بِكُمْ فِي النَّادِي. يُرْجَى الِاسْتِعْدَادُ لِبِدَايَةِ التَّمْرِينِ.';
}
export function resolveAnnouncementVoice(voices:AnnouncementVoice[],savedVoice:string,language:string){
 const exact=voices.find(voice=>voice.voiceURI===savedVoice);if(exact)return{voice:exact,exact:true};
 const locale=language.toLowerCase().split('-')[0],compatible=voices.filter(voice=>voice.lang.toLowerCase().split('-')[0]===locale);
 const voice=locale==='ar'
  ?compatible.find(item=>item.voiceURI==='local:nabra-ar')??compatible.find(item=>item.lang.toLowerCase()==='ar-eg')??compatible[0]
  :locale==='en'
   ?compatible.find(item=>item.lang.toLowerCase()==='en-us')??compatible.find(item=>item.lang.toLowerCase()==='en-gb')??compatible[0]
   :compatible[0];
 return{voice:voice??null,exact:false};
}
