export type FxApproval={required:boolean;approvalId?:string;action:string;risk:'read'|'write'|'deploy'|'destructive';summary:string;expiresAt?:number};
export type FxBrainResponse={ok:boolean;text:string;intent?:string;action?:string;args?:Record<string,unknown>;result?:unknown;approval?:FxApproval;error?:string};

async function postFx(body:Record<string,unknown>,signal?:AbortSignal):Promise<FxBrainResponse>{
 const response=await fetch('/api/fx',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal});
 const data=await response.json() as FxBrainResponse;
 // 202 means FX is intentionally waiting for human approval, not a transport failure.
 if(!response.ok&&response.status!==202)throw new Error(data.error??`FX API ${response.status}`);
 return data;
}

export function askFxApi(message:string,signal?:AbortSignal):Promise<FxBrainResponse>{
 return postFx({message},signal);
}

export function approveFxAction(action:string,args:Record<string,unknown>,approvalId:string,signal?:AbortSignal):Promise<FxBrainResponse>{
 return postFx({action,args,approvalId},signal);
}
