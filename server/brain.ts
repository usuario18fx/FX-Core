import type { BrainPlan } from './types';
import { planWithModel } from './modelBrain';
const normalize=(message:string)=>message.trim().toLowerCase().replace(/\s+/g,' ');
export async function planFx(message:string):Promise<BrainPlan>{
 const text=message.trim(),q=normalize(message);
 if(/\b(estado|status)\b/.test(q)&&/\b(fx|efex|efexx|sistema|core)\b/.test(q))return{intent:'system.status',action:'system.status',confidence:.98,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 if(/(lista|listar|muestra|mostrar|ver|dime).*(repo|repos|repositorio|repositorios)/.test(q))return{intent:'github.repos.list',action:'github.repos.list',confidence:.96,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 if(/github/.test(q))return{intent:'integration.github.status',action:'github.status',confidence:.8,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 if(/(deployment|deployments|despliegue|despliegues).*(lista|listar|muestra|mostrar|reciente|recientes)/.test(q)||/(?:lista|listar|muestra|mostrar|ver).*(deployment|deployments|despliegue|despliegues)/.test(q))return{intent:'vercel.deployments.list',action:'vercel.deployments.list',confidence:.96,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 if(/(lista|listar|muestra|mostrar|ver).*(proyecto|proyectos).*(vercel)/.test(q)||/(vercel).*(proyecto|proyectos)/.test(q))return{intent:'vercel.projects.list',action:'vercel.projects.list',confidence:.96,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 if(/vercel/.test(q))return{intent:'integration.vercel.status',action:'vercel.status',confidence:.8,source:'rule',reasoning:{needsTool:true,needsApproval:false}};
 const modelPlan=await planWithModel(text);if(modelPlan)return modelPlan;
 return{intent:'conversation.general',reply:`Recibí: ${text}. FX Brain local está activo.`,confidence:.3,source:'rule',reasoning:{needsTool:false}};
}
