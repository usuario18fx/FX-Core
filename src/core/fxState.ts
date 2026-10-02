export type FxMode = 'idle'|'listening'|'processing'|'thinking'|'executing'|'speaking'|'success'|'error';
export type FxCommandStatus = 'processing'|'executing'|'pending'|'success'|'error';
export type FxCommand = {id:string;createdAt:string;input:string;intent:string;action:string;args:Record<string,unknown>;status:FxCommandStatus;result?:unknown;error?:string};
export type FxReply = {text:string;command:FxCommand;source:'local'|'api'};
export type FxActionRequest = {action:string;args?:Record<string,unknown>};
export type FxActionResult = {ok:boolean;action:string;data?:unknown;error?:string};
export type FxState = FxMode;
