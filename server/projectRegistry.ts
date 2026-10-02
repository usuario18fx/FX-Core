export type FxProject={id:string;name:string;aliases:string[];repo:string;localPath?:string;vercelProject?:string;role:string};
export const FX_PROJECTS:FxProject[]=[
{id:'fx-core',name:'FX-Core',aliases:['fx','fx core','jarvis'],repo:'usuario18fx/FX-Core',localPath:'C:\\Projects\\FX-Core-GitHub',role:'Núcleo del asistente FX'},
{id:'userfx-web',name:'userfx-web',aliases:['userfx','user fx','mi web'],repo:'usuario18fx/userfx-web',localPath:'C:\\Projects\\userfx-web',vercelProject:'userfx-web',role:'Sitio y APIs de USER FX'},
{id:'website-fx',name:'website-FX',aliases:['website fx'],repo:'usuario18fx/website-FX',vercelProject:'website-FX',role:'Sitio web FX'},
{id:'fx-mxp',name:'Fx-mxp',aliases:['fx mxp','mxp'],repo:'usuario18fx/Fx-mxp',vercelProject:'fx-mxp',role:'Interfaz FX MXP'}
];
const norm=(s:string)=>s.toLowerCase().trim();
export function resolveProject(input:string){const q=norm(input);const exact=FX_PROJECTS.find(p=>norm(p.name)===q||norm(p.id)===q||p.aliases.some(a=>norm(a)===q));if(exact)return exact;const matches=FX_PROJECTS.flatMap(p=>[p.name,p.id,...p.aliases].map(value=>({p,key:norm(value)}))).filter(x=>x.key.length>2&&q.includes(x.key)).sort((a,b)=>b.key.length-a.key.length);return matches[0]?.p;}
export function projectContext(input:string){const p=resolveProject(input);return p?{projectId:p.id,projectName:p.name,repo:p.repo,localPath:p.localPath,vercelProject:p.vercelProject}:null;}
