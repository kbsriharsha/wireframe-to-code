import {z} from 'zod';

// Keep visual properties, omitting Excalidraw revision and editor metadata.
const visualKeys=['type','x','y','width','height','angle','strokeColor','backgroundColor','fillStyle','strokeWidth','strokeStyle','roughness','opacity','roundness','text','fontSize','fontFamily','textAlign','verticalAlign','lineHeight','containerId','groupIds','boundElements','points','startBinding','endBinding','startArrowhead','endArrowhead','fileId','scale','crop','elbowed'] as const;
export type CanvasElement={id:string;order:number;[key:string]:unknown};
export type CanvasSnapshot=CanvasElement[];
export type CanvasDelta={added:CanvasElement[];removed:CanvasElement[];updated:{before:CanvasElement;after:CanvasElement}[]};

export function snapshotCanvas(elements:readonly Record<string,any>[]):CanvasSnapshot {
 return elements.filter(element=>!element.isDeleted).map((element,order)=>{
  const visual:CanvasElement={id:element.id,order};
  for(const key of visualKeys)if(element[key]!==undefined)visual[key]=structuredClone(element[key]);
  return visual;
 });
}
export function diffCanvas(before:CanvasSnapshot,after:CanvasSnapshot):CanvasDelta {
 const old=new Map(before.map(element=>[element.id,element])),next=new Map(after.map(element=>[element.id,element]));
 return {
  added:after.filter(element=>!old.has(element.id)),
  removed:before.filter(element=>!next.has(element.id)),
  updated:after.flatMap(element=>{const previous=old.get(element.id);return previous&&JSON.stringify(previous)!==JSON.stringify(element)?[{before:previous,after:element}]:[]}),
 };
}
export function hasCanvasChanges(delta:CanvasDelta){return Boolean(delta.added.length||delta.removed.length||delta.updated.length)}

const elementSchema=z.object({id:z.string().min(1).max(200),order:z.number().int().min(0)}).catchall(z.unknown());
export const canvasDeltaSchema=z.object({
 added:z.array(elementSchema).max(3000),removed:z.array(elementSchema).max(3000),
 updated:z.array(z.object({before:elementSchema,after:elementSchema}).refine(pair=>pair.before.id===pair.after.id)).max(3000),
}).strict().refine(delta=>JSON.stringify(delta).length<=180000,'Canvas changes are too large');
