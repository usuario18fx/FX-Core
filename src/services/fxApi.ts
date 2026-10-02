export type FxApproval={required:boolean;approvalId?:string;action:string;risk:'read'|'write'|'deploy'|'destructive';summary:string;expiresAt?:number};
export type FxBrainResponse={ok:boolean;text:string;intent?:string;action?:string;args?:Record<string,unknown>;result?:unknown;approval?:FxApproval;error?:string};

export class FxApiError extends Error{
 constructor(message:string,public status?:number,public code?:string){super(message);this.name='FxApiError'}
}

async function postFx(body:Record<string,unknown>,signal?:AbortSignal):Promise<FxBrainResponse>{
 let response:Response;
 try{response=await fetch('/api/fx',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal})}
 catch(error){const message=error instanceof Error?error.message:'network_error';throw new FxApiError(`No se pudo conectar con /api/fx: ${message}`,undefined,'network_error')}
 let data:FxBrainResponse;
 try{data=await response.json() as FxBrainResponse}
 catch{throw new FxApiError(`/api/fx respondió HTTP ${response.status} sin JSON válido.`,response.status,'invalid_response')}
 if(!response.ok&&response.status!==202)throw new FxApiError(data.text||data.error||`FX API HTTP ${response.status}`,response.status,data.error);
 return data;
}

export function askFxApi(message:string,signal?:AbortSignal):Promise<FxBrainResponse>{return postFx({message},signal)}
export function approveFxAction(action:string,args:Record<string,unknown>,approvalId:string,signal?:AbortSignal):Promise<FxBrainResponse>{return postFx({action,args,approvalId},signal)}
