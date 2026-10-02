import type { FxCommand, FxReply } from './fxState';
import { askFxApi,approveFxAction,type FxBrainResponse } from '../services/fxApi';

const local=(command:FxCommand,text:string):FxReply=>({text,command:{...command,status:'success',result:text},source:'local'});
function reply(command:FxCommand,data:FxBrainResponse):FxReply{
 return{text:data.text,command:{...command,status:data.approval?'pending':data.ok?'success':'error',result:data},source:'api'};
}

export async function executeFxCommand(command:FxCommand):Promise<FxReply>{
 if(command.action==='get_time')return local(command,`Son las ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}.`);
 if(command.action==='get_date')return local(command,`Hoy es ${new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}.`);
 if(command.action==='get_help')return local(command,'Puedes hablarme o escribir. FX puede ejecutar funciones locales y enviar solicitudes al FX Brain mediante el Action Gateway.');
 try{return reply(command,await askFxApi(command.input))}
 catch(error){return{text:'FX Brain no está disponible. El núcleo local continúa activo.',command:{...command,status:'error',error:error instanceof Error?error.message:'api_error'},source:'local'}}
}

export async function executeApprovedFxAction(command:FxCommand,action:string,args:Record<string,unknown>,approvalId:string):Promise<FxReply>{
 try{return reply(command,await approveFxAction(action,args,approvalId))}
 catch(error){return{text:'No pude completar la acción aprobada.',command:{...command,status:'error',error:error instanceof Error?error.message:'api_error'},source:'local'}}
}
