import assert from 'node:assert/strict';
import test from 'node:test';
import {POST} from '../app/api/generate/route';
import {readGeneration} from '../lib/generation-stream';
import {applyHtmlPatch} from '../lib/html-patch';
import {snapshotCanvas,diffCanvas} from '../lib/canvas-changes';
const html='<html><body><button style="color:blue">Back</button><p>Unchanged content and unrelated surrounding layout remain here.</p></body></html>';
const delta=diffCanvas(snapshotCanvas([{id:'a',type:'rectangle',backgroundColor:'blue'}]),snapshotCanvas([{id:'a',type:'rectangle',backgroundColor:'red'}]));
test('both providers receive canvas context and image; instruction patches omit image',async()=>{
 const original=globalThis.fetch,oldGemini=process.env.GEMINI_API_KEY,oldOpenai=process.env.OPENAI_API_KEY;
 process.env.GEMINI_API_KEY='test';process.env.OPENAI_API_KEY='test';
 try{
  for(const provider of ['gemini','openai'])for(const canvas of [true,false]){
   let sent:any;
   globalThis.fetch=async(_url,options)=>{
    sent=JSON.parse(String(options?.body));
    const patch=JSON.stringify({replacements:[{old:'color:blue',replacement:'color:red'}]});
    const events=provider==='gemini'?[{candidates:[{content:{parts:[{text:patch}]},finishReason:'STOP'}]}]:[{type:'response.output_text.delta',delta:patch},{type:'response.completed'}];
    return new Response(events.map(event=>'data: '+JSON.stringify(event)+'\n\n').join(''));
   };
   const response=await POST(new Request('http://localhost/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider,model:provider==='gemini'?'gemini-3.5-flash-lite':'gpt-6-luna',output:'patch',html,previousInstructions:'Keep layout',instructions:'Keep layout',...(canvas?{canvasDelta:delta,image:'fixture'}:{})})}));
   assert.equal(response.status,200);
   const parts=provider==='gemini'?sent.contents[0].parts:sent.input[0].content;
   assert.equal(parts.length,canvas?2:1);
   assert.match(parts[0].text,/Canvas changes/);
   if(canvas)assert.match(parts[0].text,/"backgroundColor":"red"/);
   const patched=applyHtmlPatch(html,await readGeneration(response,()=>{},'patch'));
   assert.equal(patched,html.replace('color:blue','color:red'));
  }
  const invalid=await POST(new Request('http://localhost/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'gemini',model:'gemini-3.5-flash-lite',output:'patch',html,previousInstructions:'',instructions:'',canvasDelta:{added:[]}})}));
  assert.equal(invalid.status,400);
 }finally{
  globalThis.fetch=original;
  if(oldGemini===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldGemini;
  if(oldOpenai===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldOpenai;
 }
});
