import assert from 'node:assert/strict';
import test from 'node:test';
import {applyHtmlPatch} from '../lib/html-patch';

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
