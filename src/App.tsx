import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useFxVoice } from './hooks/useFxVoice';
import { routeCommand } from './core/commandRouter';
import { executeFxCommand } from './core/fxEngine';

type Log={id:string;who:'FX'|'TÚ'|'SYSTEM';text:string};
type FxState='idle'|'listening'|'processing'|'thinking'|'executing'|'speaking'|'success'|'error';
type FxFrame='neutral'|'blink'|'wink'|'talk-1'|'talk-2'|'talk-3';
const FX_FRAMES:FxFrame[]=['neutral','blink','wink','talk-1','talk-2','talk-3'];

function useFxAvatar(state:FxState):FxFrame{
 const [frame,setFrame]=useState<FxFrame>('neutral');
 const timers=useRef<ReturnType<typeof setTimeout>[]>([]);
 const interval=useRef<ReturnType<typeof setInterval>|null>(null);
 useEffect(()=>{
  const later=(fn:()=>void,ms:number)=>{const t=setTimeout(fn,ms);timers.current.push(t);return t;};
  const clearAll=()=>{timers.current.forEach(clearTimeout);timers.current=[];if(interval.current)clearInterval(interval.current);interval.current=null;};
  clearAll();let alive=true;
  if(state==='speaking'){const pool:FxFrame[]=['talk-1','talk-2','talk-3','talk-2'];let i=0;setFrame(pool[0]);interval.current=setInterval(()=>{i=(i+1)%pool.length;setFrame(pool[i]);},125);return clearAll;}
  const blink=(double=false)=>{setFrame('blink');later(()=>setFrame('neutral'),110);if(double){later(()=>setFrame('blink'),190);later(()=>setFrame('neutral'),300);}};
  if(state==='listening'){setFrame('wink');later(()=>setFrame('neutral'),280);}
  else if(state==='processing'||state==='executing')blink(true);
  else if(state==='success'){setFrame('wink');later(()=>setFrame('neutral'),520);}
  else if(state==='error')blink(true);else setFrame('neutral');
  const loop=()=>{if(!alive)return;const roll=Math.random();if(state==='thinking'&&roll>.72){setFrame('wink');later(()=>setFrame('neutral'),210);}else blink(roll>.82);later(loop,state==='thinking'?900+Math.random()*1000:2800+Math.random()*3800);};
  later(loop,state==='thinking'?650:1800+Math.random()*1600);
  return()=>{alive=false;clearAll();};
 },[state]);
 return frame;
}

export default function App(){
 const {state,transcript,error,listen,speak,reset,stop,setState}=useFxVoice();
 const [log,setLog]=useState<Log[]>([{id:'boot',who:'SYSTEM',text:'FX CORE v0.5 · DIRECT CHANNEL ONLINE'},{id:'hello',who:'FX',text:'Hola. Soy FX. El canal directo está disponible.'}]);
 const [input,setInput]=useState('');const [busy,setBusy]=useState(false);const avatarFrame=useFxAvatar(state as FxState);
 useEffect(()=>{FX_FRAMES.forEach(frame=>{const img=new Image();img.src=`/assets/fx-avatar/${frame}.png`;});},[]);
 const add=useCallback((who:Log['who'],text:string)=>setLog(current=>[{id:`${Date.now()}_${Math.random()}`,who,text},...current].slice(0,30)),[]);
 const run=useCallback(async(text:string)=>{const clean=text.trim();if(!clean||busy)return;setBusy(true);add('TÚ',clean);setState('thinking');try{const command=routeCommand(clean);setState('executing');const reply=await executeFxCommand(command);add('FX',reply.text);speak(reply.text);}catch(e){add('SYSTEM',e instanceof Error?e.message:'Error desconocido');setState('error');}finally{reset();setBusy(false);}},[add,busy,reset,setState,speak]);
 useEffect(()=>{if(transcript)void run(transcript);},[transcript,run]);useEffect(()=>{if(error)add('SYSTEM',`VOICE · ${error}`);},[error,add]);
 const submit=(e:FormEvent)=>{e.preventDefault();const value=input;setInput('');void run(value);};
 const label:Record<FxState,string>={idle:'SISTEMA ACTIVO',listening:'ESCUCHANDO',processing:'PROCESANDO',thinking:'PENSANDO',executing:'EJECUTANDO',speaking:'RESPONDIENDO',success:'COMPLETADO',error:'ERROR'};
 const isVoiceActive=state==='listening'||state==='speaking';const messages=[...log].slice(0,14).reverse();
 return <main className={`fx-app state-${state} frame-${avatarFrame}`}>
  <div className="fx-grid" aria-hidden="true"/><div className="fx-vignette" aria-hidden="true"/>
  <header className="fx-header"><div className="fx-brand"><span className="brand-mark">◉</span><strong>USER <b>FX</b></strong></div><nav className="fx-nav"><span>SISTEMA</span><span>CAPACIDADES</span><span>NÚCLEO</span><b>CONVERSA</b></nav><div className="fx-header-actions"><span className="online"><i/>ONLINE</span><button onClick={isVoiceActive?stop:listen}>{isVoiceActive?'DETENER':'HABLAR'}</button></div></header>
  <section className="fx-workspace">
   <section className="fx-presence"><div className="presence-meta"><span>PRESENCIA / LOCAL</span><b>{label[state as FxState]}</b></div><div className="avatar-stage"><div className="avatar-glow"/><div className="avatar-scan"/><img src={`/assets/fx-avatar/${avatarFrame}.png`} onError={e=>{e.currentTarget.src='/assets/fx-avatar/neutral.png';}} alt={`FX ${avatarFrame}`} className="fx-avatar" draggable={false}/>{state==='speaking'&&<div className="voice-bars">{Array.from({length:11}).map((_,i)=><i key={i} style={{animationDelay:`${i*.05}s`}}/>)}</div>}<div className="holo-base"><i/><i/><i/></div></div><div className="presence-caption"><i/><span>MALLA FACIAL SINCRONIZADA</span><i/></div></section>
   <section className="fx-channel"><header className="channel-head"><div><small>04 / CONVERSA</small><h1>CANAL DIRECTO</h1><p>fx://presence/local</p></div><span className="channel-state"><i/>{label[state as FxState]}</span></header>
    <div className="channel-feed" aria-live="polite">{messages.map(item=><article className={`message who-${item.who}`} key={item.id}><div className="message-avatar">{item.who==='FX'?<img src="/assets/fx-avatar/neutral.png" alt=""/>:item.who==='TÚ'?'TÚ':'SYS'}</div><div className="message-body"><div className="message-head"><b>{item.who}</b><span>{item.who==='FX'?'LOCAL CORE':item.who==='TÚ'?'DIRECT INPUT':'SYSTEM'}</span></div><p>{item.text}</p></div></article>)}</div>
    <div className="quick-actions">{['¿QUIÉN ERES?','¿QUÉ PUEDES HACER?','ESTADO DEL SISTEMA','AYÚDAME CON CÓDIGO'].map(text=><button key={text} disabled={busy} onClick={()=>void run(text)}>{text}</button>)}</div>
    <form className="composer" onSubmit={submit}><button type="button" className={`mic ${state==='listening'?'active':''}`} onClick={isVoiceActive?stop:listen}>{state==='listening'?'■':'●'}</button><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Escríbele a FX..."/><button className="send" disabled={!input.trim()||busy}>↗</button></form>
   </section>
  </section>
  <footer className="fx-footer"><FooterStatus text="FX CORE"/><FooterStatus text="VOICE READY"/><FooterStatus text="OLLAMA LOCAL"/><FooterStatus text="ACTION GATEWAY"/><span className="footer-state">{state.toUpperCase()}</span></footer>
 </main>;
}
function FooterStatus({text}:{text:string}){return <span className="footer-status"><i/>{text}</span>;}
