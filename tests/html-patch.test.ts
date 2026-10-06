import assert from 'node:assert/strict';
import test from 'node:test';
import {applyHtmlPatch} from '../lib/html-patch';
import {readGeneration} from '../lib/generation-stream';

const html='<!doctype html><html><style>.back{color:blue}.other{color:green}</style><body><button class="back">Back</button><div>Other content</div></body></html>';

test('changes one target and preserves surrounding HTML',()=>{
 const result=applyHtmlPatch(html,JSON.stringify({replacements:[{old:'.back{color:blue}',replacement:'.back{color:red}'}]}));
 assert.equal(result,html.replace('.back{color:blue}','.back{color:red}'));
});

test('rejects an ambiguous target',()=>{
 assert.throws(()=>applyHtmlPatch('blue blue',JSON.stringify({replacements:[{old:'blue',replacement:'red'}]})),/one exact target/);
});

test('rejects a missing target without returning a partial result',()=>{
 assert.throws(()=>applyHtmlPatch(html,JSON.stringify({replacements:[{old:'.back{color:blue}',replacement:'.back{color:red}'},{old:'missing',replacement:'new'}]})),/one exact target/);
});

test('rejects whole-document replacements',()=>{
 assert.throws(()=>applyHtmlPatch(html,JSON.stringify({replacements:[{old:html,replacement:'new page'}]})),/too broad/);
});

test('applies a streamed JSON patch wrapped in a Gemini code fence',async()=>{
 const patch='```json\n'+JSON.stringify({replacements:[{old:'.back{color:blue}',replacement:'.back{color:red}'}]})+'\n```';
 const frames=[...patch].map(text=>JSON.stringify({type:'text',text})).join('\n')+'\n'+JSON.stringify({type:'done'});
 const result=await readGeneration(new Response(frames),()=>{},'patch');
 assert.equal(applyHtmlPatch(html,result),html.replace('.back{color:blue}','.back{color:red}'));
});

test('applies a streamed plain JSON patch',async()=>{
 const patch=JSON.stringify({replacements:[{old:'.back{color:blue}',replacement:'.back{color:red}'}]});
 const result=await readGeneration(new Response(JSON.stringify({type:'text',text:patch})+'\n'+JSON.stringify({type:'done'})),()=>{},'patch');
 assert.equal(applyHtmlPatch(html,result),html.replace('.back{color:blue}','.back{color:red}'));
});

test('rejects a patch stream that ends without completion',async()=>{
 const patch=JSON.stringify({replacements:[{old:'.back{color:blue}',replacement:'.back{color:red}'}]});
 await assert.rejects(readGeneration(new Response(JSON.stringify({type:'text',text:patch})),()=>{},'patch'),/before generation finished/);
});

test('still unwraps HTML and Lit code responses',async()=>{
 for(const [language,code] of [['html',html],['javascript','class Widget {}']]){
  const frames=JSON.stringify({type:'text',text:'```'+language+'\n'+code+'\n```'})+'\n'+JSON.stringify({type:'done'});
  assert.equal((await readGeneration(new Response(frames),()=>{})).trim(),code);
 }
});
