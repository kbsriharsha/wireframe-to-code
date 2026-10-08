'use client';

import {Children,useRef,useState,type CSSProperties,type ReactNode} from 'react';

export function ResizableWorkspace({children}:{children:ReactNode}){
 const [share,setShare]=useState(55),[resizing,setResizing]=useState(false);
 const host=useRef<HTMLDivElement>(null);
 const panels=Children.toArray(children);
 const resize=(value:number)=>setShare(Math.min(75,Math.max(25,value)));
 return <div ref={host} className="studio-body" data-resizing={resizing} style={{'--canvas-share':`${share}fr`,'--preview-share':`${100-share}fr`} as CSSProperties}>
  {panels[0]}
  <div className="workspace-divider" role="separator" aria-label="Resize canvas and preview" aria-orientation="vertical" aria-valuemin={25} aria-valuemax={75} aria-valuenow={share} tabIndex={0} title="Drag to resize · double-click to reset"
   onPointerDown={event=>{if(event.button!==0)return;event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);setResizing(true)}}
   onPointerMove={event=>{if(!event.currentTarget.hasPointerCapture(event.pointerId))return;const bounds=host.current?.getBoundingClientRect();if(bounds)resize((event.clientX-bounds.left)/bounds.width*100)}}
   onPointerUp={event=>{if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);setResizing(false)}}
   onPointerCancel={()=>setResizing(false)} onLostPointerCapture={()=>setResizing(false)} onDoubleClick={()=>setShare(55)}
   onKeyDown={event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();resize(share+(event.key==='ArrowLeft'?-2:2))}else if(event.key==='Home'){event.preventDefault();setShare(55)}}}><span/></div>
  {panels[1]}
 </div>;
}
