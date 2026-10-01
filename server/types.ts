export type RiskLevel='read'|'write'|'deploy'|'destructive';
export type FxIntent='conversation.general'|'system.status'|'integration.github.status'|'integration.vercel.status'|'github.repos.list'|'github.issue.create'|'vercel.projects.list'|'vercel.deployments.list'|'unknown';
export type BrainPlan={intent:FxIntent|string;reply?:string;action?:string;args?:Record<string,unknown>;confidence?:number;source?:'rule'|'model'|'direct';reasoning?:{needsTool:boolean;needsApproval?:boolean}};
export type ActionResult={ok:boolean;action:string;data?:unknown;error?:string};
export type Approval={required:boolean;approvalId?:string;action:string;risk:RiskLevel;summary:string;expiresAt?:number};
export type FxRequest={message?:string;action?:string;args?:Record<string,unknown>;approvalId?:string;sessionId?:string};
export type FxResponse={ok:boolean;text:string;intent?:string;action?:string;result?:ActionResult;approval?:Approval;meta?:{brain?:'rule'|'model'|'direct';confidence?:number}};
