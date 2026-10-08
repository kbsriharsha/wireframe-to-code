export type SpeechPresentation={revision:number;text:string;partial:string;phase:'speaking'|'ready'|'applying'|'updated'|'error';error?:string};
export const emptySpeech:SpeechPresentation={revision:0,text:'',partial:'',phase:'ready'};
export function cleanSpeech(text:string){return text.replace(/\s+/g,' ').trim()}
export function recognizeSpeech(state:SpeechPresentation,final:string,partial:string):SpeechPresentation {
 const previous=state.phase==='speaking'?state.text:'';
 return {revision:state.revision+1,text:cleanSpeech(previous+' '+final),partial:cleanSpeech(partial),phase:'speaking'};
}
export function settleSpeech(state:SpeechPresentation):SpeechPresentation {
 return state.partial?state:{...state,phase:'ready'};
}
export function speechRequest(state:SpeechPresentation,revision:number,phase:'applying'|'updated'|'error',error?:string):SpeechPresentation {
 if(state.revision!==revision||state.partial||!state.text)return state;
 if(phase==='applying'&&state.phase!=='ready'&&state.phase!=='error')return state;
 if(phase!=='applying'&&state.phase!=='applying')return state;
 return {...state,phase,error};
}
