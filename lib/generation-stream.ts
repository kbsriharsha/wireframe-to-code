export async function readGeneration(response:Response,onText:(text:string)=>void,format:'code'|'patch'='code'){
 const stream=response.body;
 if(!stream)throw Error('The LLM returned an empty response.');
 const reader=stream.getReader(),decoder=new TextDecoder();
 let code='',buffer='',complete=false;
 const handleFrame=(line:string)=>{
  if(!line.trim())return;
  const frame=JSON.parse(line) as {type:'text'|'error'|'done';text?:string;message?:string};
  if(frame.type==='error')throw Error(frame.message||'The LLM stopped generation.');
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
 if(!complete)throw Error('The LLM connection ended before generation finished.');
 if(format==='patch')return code;
 return code.trim().replace(/^```(?:html|javascript|js)?\s*/i,'').replace(/```\s*$/,'');
}
