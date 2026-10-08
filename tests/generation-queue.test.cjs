const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('app/page.tsx','utf8');
let code=source.slice(source.indexOf(' function clearTimer()'),source.indexOf(' function invalidateLit()'));
code=code.replace("delay:number,label:string,kind:'full'|'patch'='full'","delay,label,kind='full'").replace('let imageMs=0,firstTextMs:number|null=null,firstPreviewMs:number|null=null','let imageMs=0,firstTextMs=null,firstPreviewMs=null').replace('new Promise<string>','new Promise').replace(' as {error:string}','');
let now=0,nextTimer=0,timers=new Map(),requests=[],releases=[],html='empty';
const ref=current=>({current});const noop=()=>{};
const c={prompt:'Initial page',transcript:'',live:true,connected:true,provider:'openai',model:'test',designSystem:'servicenow',serverKey:true};
const canvas=require(process.cwd()+'/lib/canvas-changes.ts');
const context={...canvas,structuredClone,console:{info:noop},Date:class extends Date{static now(){return now}},performance:{now:()=>now},AbortController,DOMException,FileReader:class{readAsDataURL(){this.result='data:image/png;base64,fixture';this.onload()}},useEffect:noop,window:{},validModel:()=>true,empty:'empty',DRAWING_PAUSE_MS:500,
setTimeout:(fn,delay)=>{const id=++nextTimer;timers.set(id,{fn,at:now+delay});return id},clearTimeout:id=>timers.delete(id),
setHtml:value=>html=value,setDraftHtml:noop,setDraftPreview:noop,setBusy:noop,setStatus:noop,requestSpeech:noop,draftPreviewFrom:()=>null,applyHtmlPatch:(base,raw)=>{const p=JSON.parse(raw).replacements[0];return base.replace(p.old,p.replacement)},
fetch:async(url,options)=>{requests.push({body:JSON.parse(options.body),signal:options.signal});return {ok:true}},readGeneration:()=>new Promise(resolve=>releases.push(resolve))};
for(const [key,value] of Object.entries({speechView:{revision:0},speechPending:false,timer:null,running:false,queued:false,needsFull:true,pendingDesign:false,appliedInstructions:null,appliedScene:null,htmlRef:'empty',dueAt:0,queuedDelay:600,gestureActive:false,clearEpoch:0,controller:null,config:c,mounted:true,run:noop,scene:[],typedPrompt:true,editorModule:null,api:null}))context[key]=ref(value);
vm.createContext(context);vm.runInContext(code,context);
async function flush(){for(let i=0;i<10;i++)await Promise.resolve()}
async function advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn()}await flush()}
require('node:test')('queued canvas and speech edits use successful baselines and wait for completion',async()=>{
context.schedule(1000,'initial','patch');await advance(1000);assert.equal(requests.length,1);
c.prompt='Change button green';context.schedule(1000,'edit','patch');await advance(5000);
c.prompt='Change button red';context.schedule(1000,'edit','patch');assert.equal(requests.length,1);assert.equal(requests[0].signal.aborted,false);assert.equal(timers.size,0);
releases.shift()('<html><body><button style="color:blue">Back</button></body></html>');await flush();assert.match(html,/color:blue/);assert.equal(timers.size,1);
await advance(999);assert.equal(requests.length,1);await advance(1);assert.equal(requests.length,2);assert.equal(requests[1].body.output,'patch');assert.equal(requests[1].body.html,html);assert.match(requests[1].body.instructions,/Change button red/);
context.schedule(600,'sketch','full');c.prompt='Final instructions';context.schedule(1000,'edit','patch');assert.equal(requests[1].signal.aborted,false);
releases.shift()(JSON.stringify({replacements:[{old:'blue',replacement:'red'}]}));await flush();assert.match(html,/color:red/);await advance(1000);assert.equal(requests.length,3);assert.equal(requests[2].body.output,undefined);assert.match(requests[2].body.prompt,/Final instructions/);
context.controller.current.abort();context.clearEpoch.current++;context.queued.current=false;releases.shift()('<html>discarded</html>');await flush();assert.match(html,/color:red/);
context.editorModule.current={exportToBlob:async()=>({})};context.api.current={getAppState:()=>({}),getFiles:()=>({})};
context.scene.current=[{id:'button',type:'rectangle',backgroundColor:'blue'}];
c.prompt='Canvas page';void context.run.current(true);await flush();releases.shift()('<html><body><button style="color:blue">Back</button><p>Keep unrelated surrounding content unchanged.</p></body></html>');await flush();
const startCount=requests.length;context.scene.current=[{id:'button',type:'rectangle',backgroundColor:'red'}];context.schedule(500,'canvas','patch');context.gestureActive.current=true;await advance(900);assert.equal(requests.length,startCount);context.finishGesture();await advance(499);assert.equal(requests.length,startCount);await advance(1);assert.equal(requests.length,startCount+1);assert.equal(requests.at(-1).body.canvasDelta.updated[0].before.backgroundColor,'blue');assert.equal(requests.at(-1).body.image,'fixture');
context.scene.current[0].backgroundColor='green';c.prompt='Combined speech';context.schedule(350,'voice','patch');releases.shift()('invalid JSON');await flush();assert.equal(context.appliedScene.current[0].backgroundColor,'blue');await advance(350);assert.equal(requests.at(-1).body.canvasDelta.updated[0].before.backgroundColor,'blue');assert.equal(requests.at(-1).body.canvasDelta.updated[0].after.backgroundColor,'green');assert.match(requests.at(-1).body.instructions,/Combined speech/);
releases.shift()(JSON.stringify({replacements:[{old:'blue',replacement:'green'}]}));await flush();assert.equal(context.appliedScene.current[0].backgroundColor,'green');assert.match(html,/color:green/);
c.live=false;c.designSystem='material';context.pendingDesign.current=true;context.schedule(500,'design','full');await advance(500);assert.equal(requests.at(-1).body.output,undefined);assert.equal(requests.at(-1).body.designSystem,'material');releases.shift()('<html>Material full rebuild</html>');await flush();assert.equal(html,'<html>Material full rebuild</html>');

context.typedPrompt.current=false;context.scene.current=[];c.transcript='';c.designSystem='apple';context.pendingDesign.current=true;const previousCount=requests.length;context.schedule(500,'design','full');await advance(500);assert.equal(requests.length,previousCount+1);assert.equal(requests.at(-1).body.designSystem,'apple');releases.shift()('<html>Apple full rebuild</html>');await flush();

});
