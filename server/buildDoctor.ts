import type{ActionResult}from'./types';

export type BuildProblem={file?:string;line?:number;column?:number;code?:string;message:string;raw:string};
export type BuildDiagnosis={ok:boolean;summary:string;problems:BuildProblem[];stdout:string;stderr:string};

const TS=/^(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)$/gm;
const VITE=/^(.+?):(\d+):(\d+):\s*(.+)$/gm;

function collect(text:string,re:RegExp,kind:'ts'|'vite'){
 const out:BuildProblem[]=[];let m:RegExpExecArray|null;
 re.lastIndex=0;
 while((m=re.exec(text))&&out.length<20){
  out.push(kind==='ts'
   ?{file:m[1],line:Number(m[2]),column:Number(m[3]),code:m[4],message:m[5].trim(),raw:m[0]}
   :{file:m[1],line:Number(m[2]),column:Number(m[3]),message:m[4].trim(),raw:m[0]});
 }
 return out;
}
export function diagnoseBuild(result:ActionResult):BuildDiagnosis{
 const data=(result.data||{})as Record<string,unknown>;
 const stdout=String(data.stdout||''),stderr=String(data.stderr||'');
 const combined=[stdout,stderr].filter(Boolean).join('\n');
 let problems=collect(combined,TS,'ts');
 if(!problems.length)problems=collect(combined,VITE,'vite');
 if(!problems.length&&!result.ok){
  const lines=combined.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const useful=lines.filter(x=>/error|failed|cannot|could not|not found|unresolved|ts\d+/i.test(x)).slice(0,8);
  problems=useful.map(raw=>({message:raw,raw}));
 }
 const summary=result.ok
  ?'Build completado sin errores.'
  :problems.length?('Build falló con '+problems.length+' problema'+(problems.length===1?' detectado.':'s detectados.'))
  :'Build falló; no pude extraer un error estructurado.';
 return{ok:result.ok,summary,problems,stdout,stderr};
}
