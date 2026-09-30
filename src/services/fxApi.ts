export type FxBrainResponse={ok:boolean;text:string;intent?:string;action?:string;args?:Record<string,unknown>;result?:unknown;error?:string};
export async function askFxApi(message:string,signal?:AbortSignal):Promise<FxBrainResponse>{
 const response=await fetch('/api/fx',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message}),signal});
 const data=await response.json() as FxBrainResponse;
 if(!response.ok) throw new Error(data.error ?? `FX API ${response.status}`);
 return data;
}
