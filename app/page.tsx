"use client";
import {useEffect,useRef,useState} from 'react';
import {Mic,MicOff,Settings2,Download,Loader2,Trash2,Code2,Monitor,Sparkles} from 'lucide-react';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Tabs,TabsList,TabsTrigger,TabsContent} from '@/components/ui/tabs';
import {Switch} from '@/components/ui/switch';
import {DESIGN_SYSTEMS,type DesignSystemId} from '@/lib/design-systems';
import '@excalidraw/excalidraw/index.css';
const MODEL_OPTIONS=[
 {id:'gemini-3.1-flash-lite',label:'Gemini 3.1 Flash-Lite'},
 {id:'gemini-3.5-flash-lite',label:'Gemini 3.5 Flash-Lite'},
 {id:'gemini-3.5-flash',label:'Gemini 3.5 Flash'},
 {id:'gemini-3.8-flash',label:'Gemini 3.8 Flash'},
] as const;
const validModel=(value:string)=>/^gemini-[a-z0-9.-]+$/.test(value);
const DRAWING_PAUSE_MS=600;
const TYPING_PAUSE_MS=1000;
const SPEECH_PAUSE_MS=350;
const empty='<!doctype html><html><body style="font-family:system-ui;color:#868593;display:grid;place-items:center;height:90vh;margin:0;background:#fff"><div style="text-align:center"><h2 style="font-size:18px;font-weight:500">Your interface appears here</h2><p style="font-size:14px">Connect Gemini, then draw and describe your idea.</p></div></body></html>';
async function readGeneration(response:Response,onText:(text:string)=>void){
 const stream=response.body;
 if(!stream)throw Error('Gemini returned an empty response.');
 const reader=stream.getReader(),decoder=new TextDecoder();
 let code='',buffer='',complete=false;
 const handleFrame=(line:string)=>{
  if(!line.trim())return;
  const frame=JSON.parse(line) as {type:'text'|'error'|'done';text?:string;message?:string};
  if(frame.type==='error')throw Error(frame.message||'Gemini stopped generation.');
  if(frame.type==='done'){complete=true;return}
  if(frame.type==='text'){code+=frame.text??'';onText(code)}
 };
 while(true){
  const {done,value}=await reader.read();
  buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
  const lines=buffer.split('\n');buffer=lines.pop()??'';
  for(const line of lines)handleFrame(line);
  if(done){if(buffer)handleFrame(buffer);break}
 }
 if(!complete)throw Error('Gemini connection ended before generation finished.');
 return code.replace(/^```(?:html|javascript|js)?\s*/,'').replace(/```\s*$/,'');
}
function draftPreviewFrom(code:string){
 const source=code.replace(/^```(?:html)?\s*/,'');
 const body=source.search(/<body\b[^>]*>/i);
 if(body<0)return null;
 const head=source.slice(0,body);
 if(/<style\b/i.test(head)&&!/<\/style\s*>/i.test(head))return null;
 const bodyStart=source.indexOf('>',body)+1;
 const script=source.slice(bodyStart).search(/<script\b/i);
 const visible=script<0?source:source.slice(0,bodyStart+script);
 const endings=[...visible.slice(bodyStart).matchAll(/<\/[a-z][\w:-]*\s*>/gi)];
 if(!endings.length)return null;
 const last=endings[endings.length-1];
 const complete=visible.slice(0,bodyStart+last.index!+last[0].length);
 const document=new DOMParser().parseFromString(complete,'text/html');
 document.querySelectorAll('script').forEach(element=>element.remove());
 if(!document.body.children.length)return null;
 return '<!doctype html>\n'+document.documentElement.outerHTML;
}
export default function Home(){
 const [editor,setEditor]=useState<any>(null),[settings,setSettings]=useState(false),[key,setKey]=useState(''),[serverKey,setServerKey]=useState(false),[modelChoice,setModelChoice]=useState('gemini-3.5-flash-lite'),[customModel,setCustomModel]=useState(''),[appliedCustomModel,setAppliedCustomModel]=useState(''),[designSystem,setDesignSystem]=useState<DesignSystemId>('servicenow'),[live,setLive]=useState(true),[listening,setListening]=useState(false),[speechSupported,setSpeechSupported]=useState(false),[transcript,setTranscript]=useState(''),[interim,setInterim]=useState(''),[prompt,setPrompt]=useState('Build an interface from my wireframe.'),[html,setHtml]=useState(empty),[draftHtml,setDraftHtml]=useState<string|null>(null),[draftPreview,setDraftPreview]=useState<string|null>(null),[litCode,setLitCode]=useState(''),[litDraft,setLitDraft]=useState(''),[litBusy,setLitBusy]=useState(false),[litStatus,setLitStatus]=useState('Generate a draft AIUX widget from this canvas.'),[busy,setBusy]=useState(false),[status,setStatus]=useState('Connect Gemini to start generation'),[tab,setTab]=useState('preview'),[confirmClear,setConfirmClear]=useState(false),[mobile,setMobile]=useState(false);
 const model=modelChoice==='custom'?appliedCustomModel:modelChoice;
 const connected=serverKey||Boolean(key.trim());
 const api=useRef<any>(null),editorModule=useRef<any>(null),recognition=useRef<any>(null),listeningRef=useRef(false),scene=useRef<any[]>([]),revision=useRef(0),litRevision=useRef(0),timer=useRef<ReturnType<typeof setTimeout>|null>(null),running=useRef(false),queued=useRef(false),dueAt=useRef(0),gestureActive=useRef(false),clearEpoch=useRef(0),controller=useRef<AbortController|null>(null),litController=useRef<AbortController|null>(null),config=useRef({key,serverKey,connected,model,designSystem,live,prompt,transcript}),mounted=useRef(true),run=useRef<(force?:boolean)=>Promise<void>>(async()=>{}),signature=useRef(''),speechFinal=useRef(''),typedPrompt=useRef(false);
 config.current={key,serverKey,connected,model,designSystem,live,prompt,transcript};
 useEffect(()=>{const controller=new AbortController();fetch('/api/generate',{signal:controller.signal}).then(response=>response.ok?response.json():null).then(data=>{if(data?.configured)setServerKey(true)}).catch(()=>{});return()=>controller.abort()},[]);
 useEffect(()=>{mounted.current=true;(window as any).EXCALIDRAW_ASSET_PATH='/excalidraw/';import('@excalidraw/excalidraw').then(m=>{if(mounted.current){editorModule.current=m;setEditor(()=>m.Excalidraw)}}).catch(()=>setStatus('Drawing editor could not load. Refresh to retry.'));setSpeechSupported(Boolean((window as any).SpeechRecognition||(window as any).webkitSpeechRecognition));return()=>{mounted.current=false;controller.current?.abort();litController.current?.abort();listeningRef.current=false;recognition.current?.abort();if(timer.current)clearTimeout(timer.current)}},[]);
 function clearTimer(){if(timer.current){clearTimeout(timer.current);timer.current=null}}
function armTimer(){
  clearTimer();
  if(!queued.current||gestureActive.current||!config.current.live||!config.current.connected||!validModel(config.current.model))return;
  timer.current=setTimeout(()=>{timer.current=null;if(!queued.current||gestureActive.current)return;if(running.current)controller.current?.abort();else void run.current()},Math.max(0,dueAt.current-Date.now()));
 }
function schedule(delay:number,label:string){
  revision.current++;
  controller.current?.abort();
  queued.current=true;
  dueAt.current=Date.now()+delay;
  setDraftHtml(null);
  setDraftPreview(null);
  if(!config.current.live){setStatus('Automatic generation paused');return}
  if(!config.current.connected){setStatus('Connect Gemini to start generation');return}
  if(!validModel(config.current.model)){setStatus('Enter a valid custom Gemini model ID, then click Use');return}
  setStatus(running.current?'Generating · latest changes queued':label);
  armTimer();
 }
 function finishGesture(){if(!gestureActive.current)return;gestureActive.current=false;if(queued.current){dueAt.current=Date.now()+DRAWING_PAUSE_MS;if(config.current.live&&config.current.connected&&validModel(config.current.model))setStatus(running.current?'Generating · latest changes queued':'Drawing finished · generating shortly');armTimer()}}
 useEffect(()=>{window.addEventListener('pointerup',finishGesture);window.addEventListener('pointercancel',finishGesture);return()=>{window.removeEventListener('pointerup',finishGesture);window.removeEventListener('pointercancel',finishGesture)}},[]);
 run.current=async(force=false)=>{if(running.current||(!force&&(!config.current.live||!queued.current))||!config.current.connected)return;if(!validModel(config.current.model)){setStatus('Enter a valid custom Gemini model ID, then click Use');return}const epoch=clearEpoch.current,version=revision.current,c={...config.current},elements=scene.current.filter(e=>!e.isDeleted);if(!elements.length&&!c.transcript.trim()&&!typedPrompt.current&&!force){queued.current=false;setStatus('Draw, speak, or type instructions to start');return}if(!elements.length&&!c.transcript.trim()&&!c.prompt.trim()){queued.current=false;setStatus('Add a drawing or instructions to start');return}queued.current=false;clearTimer();running.current=true;setBusy(true);setDraftHtml('');setDraftPreview(null);setStatus('Generating interface…');const activeController=new AbortController();controller.current=activeController;const started=performance.now();let imageMs=0,firstTextMs:number|null=null,firstPreviewMs:number|null=null;try{
 let image='';if(elements.length){const blob=await editorModule.current.exportToBlob({elements,appState:{...api.current.getAppState(),exportBackground:true,viewBackgroundColor:'#ffffff',exportWithDarkMode:false},files:api.current.getFiles(),mimeType:'image/png',maxWidthOrHeight:1400});image=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)})}
 imageMs=Math.round(performance.now()-started);
 if(activeController.signal.aborted)throw new DOMException('Generation canceled','AbortError');
 const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},signal:activeController.signal,body:JSON.stringify({key:c.serverKey?'':c.key,model:c.model,designSystem:c.designSystem,image,elements,prompt:c.prompt+'\nSpoken instructions: '+c.transcript})});if(!response.ok){const error=await response.json() as {error:string};throw Error(error.error)}
 let lastCodeUpdate=0,lastPreviewUpdate=0,lastPreview='';
 const code=await readGeneration(response,text=>{if(!mounted.current||epoch!==clearEpoch.current||version!==revision.current||activeController.signal.aborted)return;const elapsed=performance.now()-started;if(firstTextMs===null)firstTextMs=Math.round(elapsed);if(elapsed-lastCodeUpdate>=250){setDraftHtml(text.replace(/^```(?:html)?\s*/,'').replace(/```\s*$/,''));lastCodeUpdate=elapsed}if(firstPreviewMs===null||elapsed-lastPreviewUpdate>=1000){const preview=draftPreviewFrom(text);if(preview&&preview!==lastPreview){setDraftPreview(preview);setStatus('Preview appearing · generating interactions…');if(firstPreviewMs===null)firstPreviewMs=Math.round(elapsed);lastPreviewUpdate=elapsed;lastPreview=preview}}});
 if(mounted.current&&epoch===clearEpoch.current&&version===revision.current&&!activeController.signal.aborted){setHtml(code);setDraftHtml(null);setDraftPreview(null);setStatus('Preview updated');console.info('[generation timing]',{imageMs,firstTextMs,firstPreviewMs,totalMs:Math.round(performance.now()-started)})}
 }catch(e){if(mounted.current&&epoch===clearEpoch.current&&version===revision.current&&!(e instanceof Error&&e.name==='AbortError')){setDraftHtml(null);setStatus(e instanceof Error?e.message:'Could not generate')}}
 finally{running.current=false;if(controller.current===activeController)controller.current=null;if(mounted.current){if(!queued.current){setDraftHtml(null);setDraftPreview(null)}setBusy(false);if(queued.current&&config.current.live&&config.current.connected&&validModel(config.current.model))armTimer()}}};
 function invalidateLit(){litRevision.current++;litController.current?.abort();setLitCode('');setLitDraft('');setLitStatus('Generate a draft AIUX widget from this canvas.')}
 useEffect(()=>{invalidateLit()},[designSystem,model,prompt,transcript]);
 async function generateLit(){
  if(litBusy||busy||!validModel(model)||designSystem!=='servicenow_lit')return;
  if(!connected){setSettings(true);return}
  const version=litRevision.current,c={...config.current},elements=scene.current.filter(e=>!e.isDeleted);
  setLitBusy(true);setLitCode('');setLitDraft('');setLitStatus('Generating Lit source…');
  litController.current=new AbortController();
  try{
   let image='';
   if(elements.length){const blob=await editorModule.current.exportToBlob({elements,appState:{...api.current.getAppState(),exportBackground:true,viewBackgroundColor:'#ffffff',exportWithDarkMode:false},files:api.current.getFiles(),mimeType:'image/png',maxWidthOrHeight:1400});image=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)})}
   const response=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},signal:litController.current.signal,body:JSON.stringify({key:c.serverKey?'':c.key,model:c.model,designSystem:'servicenow_lit',output:'lit',image,elements,prompt:c.prompt+'\nSpoken instructions: '+c.transcript})});
   if(!response.ok){const error=await response.json() as {error:string};throw Error(error.error)}
   const code=await readGeneration(response,text=>{if(mounted.current&&version===litRevision.current)setLitDraft(text.replace(/^```(?:javascript|js)?\s*/,'').replace(/```\s*$/,''))});
   if(mounted.current&&version===litRevision.current){setLitCode(code);setLitDraft('');setLitStatus('Draft AIUX widget source · validate in ServiceNow before use')}
  }catch(e){if(mounted.current&&version===litRevision.current&&!(e instanceof Error&&e.name==='AbortError')){setLitDraft('');setLitStatus(e instanceof Error?e.message:'Could not generate Lit source')}}
  finally{if(mounted.current)setLitBusy(false)}
 }
 const selection=useRef({model,designSystem});
 useEffect(()=>{if(selection.current.model!==model||selection.current.designSystem!==designSystem){selection.current={model,designSystem};schedule(DRAWING_PAUSE_MS,'Settings changed · generating shortly')}},[model,designSystem]);
 useEffect(()=>{if(!live){clearTimer();queued.current=false;setStatus(running.current?'Generating interface… · Auto off':'Automatic generation paused')}else if(!connected){clearTimer();setStatus('Connect Gemini to start generation')}else if(!validModel(model)){clearTimer();setStatus('Enter a valid custom Gemini model ID, then click Use')}else if(queued.current)armTimer();else if(!running.current&&html===empty)setStatus('Draw, speak, or type instructions to start')},[connected,model,live]);
 function change(elements:readonly any[],appState?:{editingElement?:unknown}){scene.current=elements as any[];const next=elements.filter(e=>!e.isDeleted).map(e=>`${e.id}:${e.version}`).join('|');if(next===signature.current)return;signature.current=next;invalidateLit();if(!next&&!config.current.transcript.trim()&&!typedPrompt.current){controller.current?.abort();clearEpoch.current++;revision.current++;queued.current=false;clearTimer();setHtml(empty);setDraftHtml(null);setDraftPreview(null);setStatus('Canvas cleared · ready for your next idea');return}schedule(appState?.editingElement?TYPING_PAUSE_MS:DRAWING_PAUSE_MS,gestureActive.current?'Drawing… waiting for gesture to end':'Canvas changed · generating shortly')}
 function toggleMic(){if(listeningRef.current){listeningRef.current=false;recognition.current?.stop();setListening(false);return}const Speech=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Speech){setStatus('Voice input is unavailable in this browser. Use Chrome or type instructions.');return}const r=new Speech();r.continuous=true;r.interimResults=true;r.lang='en-US';recognition.current=r;r.onresult=(event:any)=>{let final='',partial='';for(let i=event.resultIndex;i<event.results.length;i++){if(event.results[i].isFinal)final+=event.results[i][0].transcript+' ';else partial+=event.results[i][0].transcript}if(final){speechFinal.current+=(speechFinal.current?' ':'')+final.trim();setTranscript(speechFinal.current);schedule(SPEECH_PAUSE_MS,'Spoken instructions received · generating shortly')}setInterim(partial)};r.onerror=(event:any)=>{listeningRef.current=false;setListening(false);setStatus(event.error==='not-allowed'?'Microphone permission was denied. Allow it in your browser to use voice.':'Voice input stopped: '+event.error)};r.onend=()=>{if(listeningRef.current){try{r.start()}catch{listeningRef.current=false;setListening(false)}}};try{r.start();listeningRef.current=true;setListening(true)}catch{setStatus('Unable to start microphone. Check browser permissions.')}}
 function clear(){controller.current?.abort();clearEpoch.current++;revision.current++;queued.current=false;gestureActive.current=false;clearTimer();listeningRef.current=false;if(recognition.current){recognition.current.onresult=null;recognition.current.onend=null;recognition.current.onerror=null;recognition.current.abort();recognition.current=null}setListening(false);speechFinal.current='';setTranscript('');setInterim('');typedPrompt.current=false;api.current?.resetScene();scene.current=[];signature.current='';queued.current=false;clearTimer();invalidateLit();setHtml(empty);setDraftHtml(null);setDraftPreview(null);setConfirmClear(false);setStatus('Canvas and spoken instructions cleared')}
 function download(){const url=URL.createObjectURL(new Blob([html],{type:'text/html'}));const a=document.createElement('a');a.href=url;a.download='wireframe-interface.html';a.click();URL.revokeObjectURL(url)}
 function downloadLit(){const url=URL.createObjectURL(new Blob([litCode],{type:'text/javascript'}));const a=document.createElement('a');a.href=url;a.download='aiux-widget.js';a.click();URL.revokeObjectURL(url)}
 function applyCustomModel(){const id=customModel.trim();if(validModel(id))setAppliedCustomModel(id);else setStatus('Enter a valid Gemini model ID, such as gemini-3.1-flash-lite')}
 const Editor=editor;
 return <main className="studio-app"><header className="app-header"><b className="app-name">Wireframe Studio</b><span className="header-divider"/><span className="header-context">{DESIGN_SYSTEMS[designSystem].label}</span><div className="header-spacer"/><label className="model-control">Model<select aria-label="Gemini model" value={modelChoice} onChange={e=>setModelChoice(e.target.value)}>{MODEL_OPTIONS.map(option=><option key={option.id} value={option.id}>{option.label}</option>)}<option value="custom">Custom model…</option></select></label>{modelChoice==='custom'&&<div className="custom-model-control"><input aria-label="Custom Gemini model ID" value={customModel} onChange={e=>{setCustomModel(e.target.value);setAppliedCustomModel('')}} onKeyDown={e=>{if(e.key==='Enter')applyCustomModel()}} placeholder="gemini-…"/><button className="header-button" onClick={applyCustomModel} disabled={!validModel(customModel.trim())}>Use</button></div>}<label className="design-control">Design system<select aria-label="Design system" value={designSystem} onChange={e=>{setDesignSystem(e.target.value as DesignSystemId);setTab('preview')}}>{(Object.keys(DESIGN_SYSTEMS) as DesignSystemId[]).map(id=><option key={id} value={id}>{DESIGN_SYSTEMS[id].label}</option>)}</select></label><label className="live-control"><Switch checked={live} onCheckedChange={setLive} aria-label="Automatic generation"/>Auto</label><button onClick={()=>{if(!connected){setSettings(true);return}clearTimer();void run.current(true)}} disabled={busy} className="header-button"><Sparkles size={16}/>Generate</button><button onClick={()=>setSettings(true)} className="header-button"><Settings2 size={16}/>{connected?'Gemini settings':'Connect Gemini'}</button><button onClick={download} disabled={html===empty} className="header-button"><Download size={16}/>Export</button></header><div className="studio-body"><section className="canvas-panel"><div className="canvas-header"><span>Canvas</span><button onClick={()=>setConfirmClear(true)} className="clear-button"><Trash2 size={15}/>Clear canvas</button></div><div className="excalidraw-host">{Editor?<Editor excalidrawAPI={(a:any)=>{api.current=a}} onChange={change} onPointerDown={()=>{gestureActive.current=true;clearTimer();if(queued.current&&config.current.live)setStatus('Drawing… waiting for gesture to end')}} onPointerUp={finishGesture} initialData={{elements:[],appState:{viewBackgroundColor:'#ffffff'}}} UIOptions={{canvasActions:{loadScene:true,saveToActiveFile:true,clearCanvas:true,export:{saveFileToDisk:true},toggleTheme:true}}}/>:<div className="loading-editor"><Loader2 className="spin"/>Loading drawing tools…</div>}</div><div className="voice-panel"><button className={"mic-button "+(listening?"listening":"")} onClick={toggleMic} disabled={!speechSupported} aria-pressed={listening}>{listening?<MicOff size={17}/>:<Mic size={17}/>} {listening?"Stop microphone":"Speak instructions"}</button><div className="voice-copy"><span>{listening?"Listening · describe changes as you draw":speechSupported?"Draw and speak. The preview follows automatically.":"Voice is unavailable in this browser. Type instructions below."}</span>{interim&&<span className="interim">{interim}</span>}</div></div><div className="instructions"><textarea aria-label="Interface instructions" value={prompt} onChange={e=>{typedPrompt.current=true;setPrompt(e.target.value);schedule(TYPING_PAUSE_MS,'Instructions changed · generating shortly')}} rows={2}/>{transcript&&<div className="transcript"><label>Spoken instructions</label><textarea aria-label="Spoken instructions" value={transcript} onChange={e=>{speechFinal.current=e.target.value;setTranscript(e.target.value);schedule(TYPING_PAUSE_MS,'Spoken instructions changed · generating shortly')}}/><button onClick={()=>{speechFinal.current='';setTranscript('');setInterim('');schedule(SPEECH_PAUSE_MS,'Spoken instructions cleared · generating shortly')}}>Clear transcript</button></div>}</div></section><section className="output-panel"><Tabs defaultValue="preview" value={tab} onValueChange={setTab} className="output-tabs"><div className="output-header"><TabsList variant="line"><TabsTrigger value="preview"><Monitor size={16}/>Preview</TabsTrigger><TabsTrigger value="code"><Code2 size={16}/>HTML</TabsTrigger>{designSystem==='servicenow_lit'&&<TabsTrigger value="lit"><Code2 size={16}/>AIUX Lit</TabsTrigger>}</TabsList><button onClick={()=>setMobile(!mobile)} className="device-toggle">{mobile?'Mobile':'Desktop'}</button></div><TabsContent value="preview" className="preview-pane"><iframe key={draftPreview===null?'complete':'draft'} className={mobile?'mobile':''} title="Generated interface" srcDoc={draftPreview??html} sandbox={draftPreview===null?'allow-scripts':''}/></TabsContent><TabsContent value="code" className="code-pane"><textarea spellCheck={false} aria-label="Generated HTML" value={draftHtml!==null?draftHtml:html===empty?'':html} readOnly={busy} onChange={e=>setHtml(e.target.value)}/></TabsContent>{designSystem==='servicenow_lit'&&<TabsContent value="lit" className="code-pane lit-pane"><div className="lit-toolbar"><button onClick={()=>void generateLit()} disabled={litBusy||busy||!connected||!validModel(model)} className="header-button">{litBusy?<Loader2 className="spin" size={15}/>:<Sparkles size={15}/>}Generate Lit source</button><button onClick={downloadLit} disabled={!litCode||litBusy} className="header-button"><Download size={15}/>Export Lit</button></div><textarea spellCheck={false} aria-label="Draft AIUX Lit widget source" value={litDraft||litCode} readOnly placeholder="Generate Lit source to see a draft Employee Slate AIUX widget."/><p className="lit-status" role="status">{litStatus}</p></TabsContent>}</Tabs><div className="generation-status" role="status">{busy?<Loader2 className="spin" size={15}/>:<span className={'state-dot '+(connected&&live?'enabled':'')}/>}<span>{status}</span></div><p className="output-note">{designSystem==='servicenow_lit'?'Standalone preview plus optional AIUX Lit draft':'Standalone HTML prototype'} · {DESIGN_SYSTEMS[designSystem].label} visual style</p></section></div><Dialog open={settings} onOpenChange={setSettings}><DialogContent><DialogTitle>Gemini connection</DialogTitle><DialogDescription>Generation sends the current drawing and instructions to Gemini. API usage may incur charges.</DialogDescription>{serverKey?<p className="connection-note">Using the API key from .env.local on this server.</p>:<label className="field">API key<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder="Google AI Studio API key"/></label>}<p className="connection-note">Choose a Gemini model from the Model dropdown in the header.</p><p className="connection-note">{serverKey?"The server keeps your API key out of the browser. ":"A key entered here stays in this tab’s memory. "}Voice transcription uses your browser’s speech recognition service. Drawings and generated HTML are not saved by this studio.</p><a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini API key</a><button className="primary-button" onClick={()=>setSettings(false)}>Done</button></DialogContent></Dialog><Dialog open={confirmClear} onOpenChange={setConfirmClear}><DialogContent><DialogTitle>Clear the canvas?</DialogTitle><DialogDescription>This removes the current drawing, generated preview, and spoken instructions. The microphone stops if it is listening. Typed interface instructions remain.</DialogDescription><div className="dialog-actions"><button className="header-button" onClick={()=>setConfirmClear(false)}>Cancel</button><button className="primary-button" onClick={clear}>Clear canvas</button></div></DialogContent></Dialog></main>
}
