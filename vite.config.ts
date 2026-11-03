import{defineConfig,loadEnv,type Plugin}from'vite';import react from'@vitejs/plugin-react';import type{IncomingMessage,ServerResponse}from'node:http';import{handleFx}from'./server/fxHandler.ts';
async function readJson(req:IncomingMessage){let raw='';for await(const chunk of req)raw+=chunk;try{return raw?JSON.parse(raw):{};}catch{return{};}}
async function readText(req:IncomingMessage){let raw='';for await(const chunk of req)raw+=chunk;return raw;}
function fxApi():Plugin{return{name:'fx-local-api',configureServer(server){server.middlewares.use('/api/fx',async(req:IncomingMessage,res:ServerResponse)=>{if(req.method!=='POST'){res.statusCode=405;res.end(JSON.stringify({ok:false,error:'method_not_allowed'}));return;}const out=await handleFx(await readJson(req));res.statusCode=out.status;res.setHeader('content-type','application/json; charset=utf-8');res.end(JSON.stringify(out.body));});
server.middlewares.use('/api/realtime/session',async(req:IncomingMessage,res:ServerResponse)=>{if(req.method!=='POST'){res.statusCode=405;res.end('method_not_allowed');return;}const key=process.env.OPENAI_API_KEY;if(!key){res.statusCode=503;res.end('OPENAI_API_KEY_not_configured');return;}const sdp=await readText(req);const session = {
  type: 'realtime',
  model: process.env.OPENAI_REALTIME_MODEL || 'gpt-realtime',
  audio: {
    input: { transcription: { model: 'gpt-4o-mini-transcribe' }, turn_detection: { type: 'server_vad', create_response: false } },
    output: { voice: process.env.OPENAI_REALTIME_VOICE || 'cedar' }
  }
};
try {
  const form = new FormData();
  form.set('sdp', sdp);
  form.set('session', JSON.stringify(session));
  const response = await fetch('https://api.openai.com/v1/realtime/calls', {
    method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: form
  });
  res.statusCode = response.status;
  res.setHeader('content-type', response.ok ? 'application/sdp' : 'text/plain; charset=utf-8');
  res.end(await response.text());
}catch(e){res.statusCode=502;res.end(e instanceof Error?e.message:'realtime_connection_failed');}});}};}
export default defineConfig(({mode})=>{Object.assign(process.env,loadEnv(mode,process.cwd(),''));return{plugins:[react(),fxApi()]};});