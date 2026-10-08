import assert from 'node:assert/strict';
import test from 'node:test';
import {emptySpeech,recognizeSpeech,settleSpeech,speechRequest,cleanSpeech} from '../lib/speech-presentation';
test('partial speech stays expanded and finalized segments form one instruction',()=>{
 let state=recognizeSpeech(emptySpeech,'','Make the button');
 assert.equal(settleSpeech(state).phase,'speaking');
 state=recognizeSpeech(state,'Make the button','red');
 assert.equal(state.text,'Make the button');
 state=settleSpeech(recognizeSpeech(state,'red',''));
 assert.equal(state.text,'Make the button red');assert.equal(state.phase,'ready');
});
test('next utterance replaces the card while full history is independent',()=>{
 const previous=settleSpeech(recognizeSpeech(emptySpeech,'Make the button red',''));
 const next=recognizeSpeech(previous,'Move it','to the right');
 assert.equal(next.text,'Move it');assert.equal(next.partial,'to the right');
});
test('older generation cannot mark newer speech updated or failed',()=>{
 let state=settleSpeech(recognizeSpeech(emptySpeech,'Change color',''));
 const revision=state.revision;state=speechRequest(state,revision,'applying');
 assert.equal(state.phase,'applying');
 const newer=recognizeSpeech(state,'','Move the button');
 assert.deepEqual(speechRequest(newer,revision,'updated'),newer);
 assert.deepEqual(speechRequest(newer,revision,'error','Invalid patch'),newer);
});
test('only an applying request can complete; failures allow retry',()=>{
 const ready=settleSpeech(recognizeSpeech(emptySpeech,'Change color',''));
 assert.equal(speechRequest(ready,ready.revision,'updated').phase,'ready');
 const applying=speechRequest(ready,ready.revision,'applying');
 const failed=speechRequest(applying,ready.revision,'error','Invalid patch');
 assert.equal(failed.error,'Invalid patch');
 assert.equal(speechRequest(failed,ready.revision,'applying').phase,'applying');
 assert.equal(speechRequest(applying,ready.revision,'updated').phase,'updated');
});
test('cleanup preserves wording and recognized punctuation',()=>{
 assert.equal(cleanSpeech('  Make  it\nred, please.  '),'Make it red, please.');
});
