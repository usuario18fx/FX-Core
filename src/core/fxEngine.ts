import type { FxCommand, FxReply } from './fxState';
import { askFxApi,approveFxAction,type FxBrainResponse } from '../services/fxApi';

const local=(command:FxCommand,text:string):FxReply=>({text,command:{...command,status:'success',result:text},source:'local'});
function reply(command:FxCommand,data:FxBrainResponse):FxReply{return{text:data.text,command:{...command,status:data.approval?'pending':data.ok?'success':'error',result:data},source:'api'}}
function failure(command:FxCommand,error:unknown,prefix:string):FxReply{
 const detail=error instanceof Error?error.message:'api_error';
 return{text:`${prefix} ${detail}`,command:{...command,status:'error',error:detail},source:'local'};
}

export async function executeFxCommand(command:FxCommand):Promise<FxReply>{
 if(command.action==='get_time')return local(command,`Son las ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}.`);
 if(command.action==='get_date')return local(command,`Hoy es ${new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}.`);
 if(command.action==='get_help')return local(command,'Puedes hablarme o escribir. FX puede ejecutar funciones locales y enviar solicitudes al FX Brain mediante el Action Gateway.');
 try{return reply(command,await askFxApi(command.input))}
 catch(error){return failure(command,error,'FX API no respondió correctamente.')}
}

export async function executeApprovedFxAction(command:FxCommand,action:string,args:Record<string,unknown>,approvalId:string):Promise<FxReply>{
 try{return reply(command,await approveFxAction(action,args,approvalId))}
 catch(error){return failure(command,error,'No pude completar la acción aprobada.')}
}
