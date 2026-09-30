import type { FxCommand, FxReply } from './fxState';
import { askFxApi } from '../services/fxApi';
const local=(command:FxCommand,text:string):FxReply=>({text,command:{...command,status:'success',result:text},source:'local'});
export async function executeFxCommand(command:FxCommand):Promise<FxReply>{
 if(command.action==='get_time') return local(command,`Son las ${new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}.`);
 if(command.action==='get_date') return local(command,`Hoy es ${new Date().toLocaleDateString('es-MX',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}.`);
 if(command.action==='get_help') return local(command,'Puedes hablarme o escribir. FX puede ejecutar funciones locales y enviar solicitudes al FX Brain mediante el Action Gateway.');
 try{const data=await askFxApi(command.input);return {text:data.text,command:{...command,status:data.ok?'success':'error',result:data},source:'api'};}
 catch(error){return {text:'FX Brain no está disponible. El núcleo local continúa activo.',command:{...command,status:'error',error:error instanceof Error?error.message:'api_error'},source:'local'};}
}
