import {DESIGN_SYSTEMS,isDesignSystemId} from '@/lib/design-systems';

type StreamFrame = {type:'text';text:string}|{type:'error';message:string}|{type:'done'};

function errorMessage(value:unknown, fallback:string, apiKey:string) {
 const error=value&&typeof value==='object'&&'error' in value?value.error:value;
 const detail=error&&typeof error==='object'&&'message' in error?error.message:undefined;
 const message=typeof detail==='string'&&detail.trim()?detail.trim():fallback;
 return message.replaceAll(apiKey,'[redacted]').slice(0,500);
}

export async function GET() {
 return Response.json({configured:Boolean(process.env.GEMINI_API_KEY?.trim())},{headers:{'Cache-Control':'no-store'}});
}

export async function POST(request:Request) {
 try {
  const input=await request.json() as Record<string,unknown>;
  if(!input||typeof input!=='object')return Response.json({error:'Invalid request.'},{status:400});
  const {key,model,image,prompt,elements,designSystem,output}=input;
  const apiKey=process.env.GEMINI_API_KEY?.trim()||(typeof key==='string'?key.trim():'');
  if(!apiKey||typeof model!=='string'||!/^gemini-[a-z0-9.-]+$/.test(model))return Response.json({error:'Set GEMINI_API_KEY in .env.local or enter a key in Gemini settings, then check the model name.'},{status:400});
  if(typeof image!=='string'||image.length>6000000||!Array.isArray(elements)||elements.length>3000)return Response.json({error:'Drawing is too large. Reduce it and try again.'},{status:400});
  if(designSystem!==undefined&&!isDesignSystemId(designSystem))return Response.json({error:'Choose a supported design system.'},{status:400});
  if(output!==undefined&&output!=='html'&&output!=='lit')return Response.json({error:'Choose a supported output format.'},{status:400});
  if(output==='lit'&&designSystem!=='servicenow_lit')return Response.json({error:'Lit source is available with ServiceNow Lit (AIUX).'}, {status:400});
  const selected=DESIGN_SYSTEMS[designSystem===undefined?'servicenow':designSystem];

  const task=output==='lit'
   ? `Generate draft source for one ServiceNow Employee Slate AIUX widget matching the supplied Excalidraw sketch and instructions. Return JavaScript source only, no markdown. Import html and css from 'lit' and AIUXWidgetElement from '@servicenow/aiux-components-core'. Define one custom element with a unique tag name, reactive properties where needed, static styles using css, and a render method using Lit templates. Use sample data and local interactions only; leave clear comments where instance data, roles, or actions must be connected. Do not invent ServiceNow platform APIs, claim this source is deployable, or make network calls. Requirements: ${String(prompt).slice(0,12000)}. Elements: ${JSON.stringify(elements).slice(0,90000)}`
   : `Generate one complete HTML document with embedded CSS and vanilla JavaScript matching the supplied Excalidraw sketch and instructions. Return HTML only, no markdown. Selected design system: ${selected.label}. ${selected.guidance} Recreate its visual language in standalone HTML; do not claim to use its native components or packages. Use the drawing's layout and labels. Implement usable local interactions with clearly identified sample data. No network calls, external assets, external libraries, or credentials. Requirements: ${String(prompt).slice(0,12000)}. Elements: ${JSON.stringify(elements).slice(0,90000)}`;
  const parts:any[]=[{text:task}];
  if(image)parts.push({inline_data:{mime_type:'image/png',data:image}});

  const upstream=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,{
   method:'POST',
   headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
   signal:AbortSignal.any([request.signal,AbortSignal.timeout(90000)]),
   body:JSON.stringify({contents:[{parts}],generationConfig:{temperature:0.4,maxOutputTokens:16000}}),
  });
  if(!upstream.ok){
   const body=await upstream.json().catch(()=>null);
   const fallback=upstream.status===429?'Gemini rate limit reached. Try again shortly.':`Gemini request failed (${upstream.status}). Check your key and model.`;
   return Response.json({error:errorMessage(body,fallback,apiKey)},{status:upstream.status});
  }
  if(!upstream.body)return Response.json({error:'Gemini returned an empty response.'},{status:502});

  const reader=upstream.body.getReader();
  const decoder=new TextDecoder();
  const encoder=new TextEncoder();
  let cancelled=false;
  const stream=new ReadableStream<Uint8Array>({
   async start(controller){
    let buffer='',emitted=false,finishReason='';
    const send=(frame:StreamFrame)=>{if(!cancelled)controller.enqueue(encoder.encode(JSON.stringify(frame)+'\n'))};
    const processLine=(line:string)=>{
     if(!line.startsWith('data:'))return;
     const data=line.slice(5).trim();
     if(!data||data==='[DONE]')return;
     const event=JSON.parse(data);
     if(event.error)throw Error(errorMessage(event,'Gemini stopped generation.',apiKey));
     if(event.promptFeedback?.blockReason)finishReason=String(event.promptFeedback.blockReason);
     const candidate=event.candidates?.[0];
     if(candidate?.finishReason)finishReason=String(candidate.finishReason);
     const content=(candidate?.content?.parts??[]).filter((part:{thought?:boolean})=>!part.thought).map((part:{text?:string})=>part.text??'').join('');
     if(content){emitted=true;send({type:'text',text:content})}
    };
    try {
     while(true){
      const {done,value}=await reader.read();
      buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');
      buffer=lines.pop()??'';
      for(const line of lines)processLine(line.trimEnd());
      if(done){if(buffer)processLine(buffer.trimEnd());break}
     }
     if(!emitted)throw Error(finishReason?`Gemini returned no interface (${finishReason}).`:'Gemini returned no interface. Check the model and try again.');
     if(finishReason&&finishReason!=='STOP')throw Error(`Gemini stopped generation (${finishReason}). Try a smaller request or another model.`);
     send({type:'done'});
    }catch(error){
     if(!request.signal.aborted)send({type:'error',message:error instanceof Error?error.message:'Gemini stream failed.'});
    }finally{if(!cancelled)controller.close()}
   },
   cancel(){cancelled=true;void reader.cancel().catch(()=>{})},
  });
  return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Generation timed out or could not connect. Check settings and retry.'},{status:502});}
}
