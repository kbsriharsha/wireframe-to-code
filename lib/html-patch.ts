export type HtmlReplacement={old:string;replacement:string};

export function applyHtmlPatch(html:string,raw:string):string {
 const source=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'');
 let value:unknown;
 try{value=JSON.parse(source)}catch{throw Error('The LLM returned an invalid edit. Rephrase the change and try again.')}
 const replacements=(value as {replacements?:unknown})?.replacements;
 if(!Array.isArray(replacements)||replacements.length<1||replacements.length>8)throw Error('The LLM returned an invalid edit. Rephrase the change and try again.');
 let next=html;
 let touched=0,written=0;
 for(const item of replacements){
  if(!item||typeof item!=='object')throw Error('The LLM returned an invalid edit.');
  const {old,replacement}=item as Partial<HtmlReplacement>;
  if(typeof old!=='string'||typeof replacement!=='string'||!old||old===replacement||old.length>6000||replacement.length>9000||old.length>html.length/2)throw Error('The edit is too broad for a safe patch. Rephrase it or click Generate to rebuild.');
  touched+=old.length;written+=replacement.length;
  if(touched>html.length/2||written>html.length/2)throw Error('The edit is too broad for a safe patch. Rephrase it or click Generate to rebuild.');
  const first=next.indexOf(old);
  if(first<0||next.indexOf(old,first+old.length)>=0)throw Error('The edit could not identify one exact target. Rephrase it or click Generate to rebuild.');
  next=next.slice(0,first)+replacement+next.slice(first+old.length);
 }
 return next;
}
