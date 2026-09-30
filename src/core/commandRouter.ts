import type { FxCommand } from './fxState';

const make=(input:string,intent:string,action:string,args:Record<string,unknown>={}):FxCommand=>({id:`fx_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,createdAt:new Date().toISOString(),input,intent,action,args:{raw:input,...args},status:'processing'});

export function routeCommand(input:string):FxCommand{
 const text=input.trim().toLowerCase();
 if(/\b(hora|qué hora|que hora)\b/.test(text)) return make(input,'system.time','get_time');
 if(/\b(fecha|qué día|que dia|día es|dia es)\b/.test(text)) return make(input,'system.date','get_date');
 if(/\b(estado|status|sistema)\b/.test(text)) return make(input,'system.status','get_system_status');
 if(/\b(ayuda|comandos|qué puedes hacer|que puedes hacer)\b/.test(text)) return make(input,'system.help','get_help');
 if(/\b(github|repositorio|repo)\b/.test(text)) return make(input,'integration.github','github_status');
 if(/\b(vercel|deploy|deployment)\b/.test(text)) return make(input,'integration.vercel','vercel_status');
 return make(input,'conversation.general','ask_brain');
}
