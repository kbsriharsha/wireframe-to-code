import assert from 'node:assert/strict';
import test from 'node:test';
import {snapshotCanvas,diffCanvas,hasCanvasChanges,canvasDeltaSchema} from '../lib/canvas-changes';
const button={id:'button',type:'rectangle',x:10,y:20,width:120,height:40,backgroundColor:'blue',points:[[0,0]],version:1};
test('visual snapshot ignores revisions and stays immutable',()=>{
 const element=structuredClone(button),before=snapshotCanvas([element]);
 element.points[0][0]=30;
 assert.equal(before[0].points instanceof Array&&(before[0].points as number[][])[0][0],0);
 assert.equal(hasCanvasChanges(diffCanvas(before,snapshotCanvas([{...button,version:9,versionNonce:22,updated:123}]))),false);
});
test('color, label, position, size and points produce before/after updates',()=>{
 const before=snapshotCanvas([button]);
 for(const edit of [{backgroundColor:'red'},{text:'Login'},{x:50},{width:200},{points:[[1,2]]}]){
  const delta=diffCanvas(before,snapshotCanvas([{...button,...edit}]));
  assert.equal(delta.updated.length,1);assert.deepEqual(delta.updated[0].before,before[0]);
 }
});
test('add, delete, undo and redo compare against the successful scene',()=>{
 const before=snapshotCanvas([button]),after=snapshotCanvas([button,{...button,id:'other'}]);
 assert.equal(diffCanvas(before,after).added.length,1);
 assert.equal(diffCanvas(after,before).removed.length,1);
 assert.equal(diffCanvas(before,snapshotCanvas([{...button,isDeleted:true}])).removed.length,1);
 assert.equal(hasCanvasChanges(diffCanvas(before,snapshotCanvas([button]))),false);
 assert.equal(diffCanvas(before,after).added.length,1);
});
test('failed edits retain baseline and later edits combine from that baseline',()=>{
 const before=snapshotCanvas([button]);
 diffCanvas(before,snapshotCanvas([{...button,backgroundColor:'red'}]));
 const delta=diffCanvas(before,snapshotCanvas([{...button,backgroundColor:'red',x:90}]));
 assert.equal(delta.updated[0].before.backgroundColor,'blue');assert.equal(delta.updated[0].after.x,90);
});
test('reject oversized and mismatched canvas deltas',()=>{
 assert.equal(canvasDeltaSchema.safeParse({added:[],removed:[],updated:[{before:{id:'a',order:0},after:{id:'b',order:0}}]}).success,false);
 assert.equal(canvasDeltaSchema.safeParse({added:[{id:'a',order:0,text:'x'.repeat(180000)}],removed:[],updated:[]}).success,false);
});
