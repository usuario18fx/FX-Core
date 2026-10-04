import{resolveProject,type FxProject}from'./projectRegistry.ts';
type Session={project?:FxProject;updatedAt:number};
const sessions=new Map<string,Session>();
const TTL=1000*60*60*6;
function clean(){const now=Date.now();for(const[id,s]of sessions)if(now-s.updatedAt>TTL)sessions.delete(id);}
export function getSession(id='default'){clean();return sessions.get(id);}
export function setActiveProject(id:string,input:string){const project=resolveProject(input);if(!project)return null;sessions.set(id,{project,updatedAt:Date.now()});return project;}
export function touchProjectFromMessage(id:string,message:string){const project=resolveProject(message);if(project)sessions.set(id,{project,updatedAt:Date.now()});return project||sessions.get(id)?.project;}
export function clearSession(id='default'){sessions.delete(id);}
