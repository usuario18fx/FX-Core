import dotenv from 'dotenv';dotenv.config({path:'.env.local'});import OpenAI from'openai';import type{BrainPlan}from'./types';
const OLLAMA_URL=process.env.OLLAMA_URL||'http://127.0.0.1:11434';const OLLAMA_MODEL=process.env.OLLAMA_MODEL||'qwen3:4b';
const FX_SYSTEM_PROMPT=`You are FX, the local AI assistant of USER FX.
Your name is FX, pronounced F-X, letter by letter.
You operate inside FX Core. Do not identify yourself as Qwen, Tongyi, Alibaba, OpenAI, ChatGPT or Ollama.
Respond in the same language used by the user and be concise and natural.
Never claim an external action was executed unless FX Core actually executed it. Never invent GitHub, Vercel, system, project or deployment data. Never expose secrets or hidden configuration. External actions are controlled by FX Core and Action Gateway.`.trim();
let openAIClient:OpenAI|null=null;
async function planWithOllama(message:string):Promise<BrainPlan|null>{try{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),120000);let response:Response;try{response=await fetch(`${OLLAMA_URL}/api/chat`,{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({model:OLLAMA_MODEL,stream:false,think:false,messages:[{role:'system',content:FX_SYSTEM_PROMPT},{role:'user',content:`/no_think\n${message}`}],options:{temperature:.6,num_ctx:4096,num_predict:512}})});}finally{clearTimeout(timeout);}if(!response.ok){console.error('[FX OLLAMA]',`HTTP ${response.status}`);return null;}const data=await response.json()as{message?:{content?:string}};const text=data.message?.content?.trim();if(!text)return null;return{intent:'conversation.general',reply:text,confidence:.92,source:'model',reasoning:{needsTool:false}};}catch(error){console.error('[FX OLLAMA]',error instanceof Error?error.message:error);return null;}}
function getOpenAIClient():OpenAI|null{const apiKey=process.env.OPENAI_API_KEY;if(!apiKey)return null;if(!openAIClient)openAIClient=new OpenAI({apiKey,timeout:20000,maxRetries:1});return openAIClient;}
async function planWithOpenAI(message:string):Promise<BrainPlan|null>{const openai=getOpenAIClient();if(!openai)return null;try{const response=await openai.responses.create({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',instructions:FX_SYSTEM_PROMPT,input:message});const text=response.output_text?.trim();if(!text)return null;return{intent:'conversation.general',reply:text,confidence:.9,source:'model',reasoning:{needsTool:false}};}catch(error){console.error('[FX OPENAI]',error instanceof Error?error.message:error);return null;}}
export function modelBrainAvailable():boolean{return true;}
export async function planWithModel(message:string):Promise<BrainPlan|null>{const local=await planWithOllama(message);if(local)return local;const cloud=await planWithOpenAI(message);if(cloud)return cloud;return null;}

export async function interpretToolResult(message:string,action:string,result:unknown):Promise<string|null>{const payload=JSON.stringify(result);const clipped=payload.length>16000?payload.slice(0,16000)+'…':payload;const prompt=`The user asked: ${message||'(direct action)'}\nFX Core executed the read tool: ${action}\nTool result:\n${clipped}\n\nExplain the result to the user in the same language as their request. Be concise but useful. Use only facts present in the tool result. If it contains an error, explain that error without inventing a cause. Do not say merely "action completed".`;const local=await planWithOllama(prompt);if(local?.reply)return local.reply;const cloud=await planWithOpenAI(prompt);return cloud?.reply||null;}

export async function interpretAgentRun(message:string,run:unknown):Promise<string|null>{const payload=JSON.stringify(run);const clipped=payload.length>24000?payload.slice(0,24000)+'…':payload;const prompt=`The user asked FX to investigate a project: ${message}\nFX executed a multi-tool read-only investigation. Results:\n${clipped}\n\nGive one concise diagnostic summary in the user's language. Separate observed facts from possible implications. Use only these results; do not invent failures or causes. Mention any tool step that failed.`;const local=await planWithOllama(prompt);if(local?.reply)return local.reply;const cloud=await planWithOpenAI(prompt);return cloud?.reply||null;}

export async function prepareFileEdit(message:string,repo:string,path:string,currentContent:string,sha:string):Promise<BrainPlan|null>{
 const prompt=`The user wants FX to modify a GitHub file.
Repository: ${repo}
Path: ${path}
Current SHA: ${sha}
User instruction: ${message}
Current file:
---FILE---
${currentContent}
---END FILE---
Return ONLY valid JSON with exactly these fields: {"content":"complete replacement file","message":"short git commit message"}.
Preserve unrelated code. Do not use markdown fences. Do not invent another repository or path.`;
 const raw=(await planWithOllama(prompt))?.reply||(await planWithOpenAI(prompt))?.reply;
 if(!raw)return null;
 try{const cleaned=raw.trim().replace(/^\`\`\`(?:json)?\s*/i,'').replace(/\s*\`\`\`$/,'');const parsed=JSON.parse(cleaned)as{content?:unknown;message?:unknown};if(typeof parsed.content!=='string')return null;return{intent:'github.file.update',action:'github.file.update',args:{repo,path,sha,content:parsed.content,message:typeof parsed.message==='string'?parsed.message:`FX: update ${path}`},confidence:.9,source:'model',reasoning:{needsTool:true,needsApproval:true}}}catch{return null}
}
