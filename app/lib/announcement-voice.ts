export type AnnouncementVoice=Pick<SpeechSynthesisVoice,'voiceURI'|'name'|'lang'>;
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
