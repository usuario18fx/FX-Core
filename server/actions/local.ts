import{execFile}from'node:child_process';
import{promisify}from'node:util';
import{resolve,normalize}from'node:path';
import{FX_PROJECTS}from'../projectRegistry';
import type{ActionResult}from'../types';

const exec=promisify(execFile);
const MAX_BUFFER=1024*1024;
const TIMEOUT=45000;

function projectPath(input:unknown){
 const id=String(input||'');
 const project=FX_PROJECTS.find(p=>p.id===id||p.name.toLowerCase()===id.toLowerCase());
 if(!project?.localPath)throw new Error('local_project_not_configured');
 const target=resolve(project.localPath),allowed=resolve('C:\\Projects');
 const rel=normalize(target).toLowerCase(),root=normalize(allowed).toLowerCase();
 const boundary=rel.slice(root.length,root.length+1);
 const inside=rel===root||(rel.startsWith(root)&&(boundary==='\\'||boundary==='/'));
 if(!inside)throw new Error('local_path_not_allowed');
 return{project,target};
}
async function run(action:string,file:string,args:string[],cwd:string):Promise<ActionResult>{
 try{const{stdout,stderr}=await exec(file,args,{cwd,timeout:TIMEOUT,maxBuffer:MAX_BUFFER,windowsHide:true});return{ok:true,action,data:{cwd,exitCode:0,stdout:String(stdout).slice(-40000),stderr:String(stderr).slice(-20000)}}}
 catch(e:any){return{ok:false,action,error:e?.code==='ETIMEDOUT'?'local_command_timeout':'local_command_failed',data:{cwd,stdout:String(e?.stdout||'').slice(-40000),stderr:String(e?.stderr||e?.message||'').slice(-20000),exitCode:e?.code}}}
}
export async function localGitStatus(args:Record<string,unknown>):Promise<ActionResult>{try{const{target}=projectPath(args.project);return run('local.git.status','git',['status','--short','--branch'],target)}catch(e){return{ok:false,action:'local.git.status',error:String(e)}}}
export async function localGitDiff(args:Record<string,unknown>):Promise<ActionResult>{try{const{target}=projectPath(args.project);return run('local.git.diff','git',['diff','--'],target)}catch(e){return{ok:false,action:'local.git.diff',error:String(e)}}}
export async function localGitLog(args:Record<string,unknown>):Promise<ActionResult>{try{const{target}=projectPath(args.project);return run('local.git.log','git',['log','-n','8','--oneline','--decorate'],target)}catch(e){return{ok:false,action:'local.git.log',error:String(e)}}}
export async function localBuild(args:Record<string,unknown>):Promise<ActionResult>{try{const{target}=projectPath(args.project);return process.platform==='win32'?run('local.npm.build',process.env.ComSpec||'C:\\Windows\\System32\\cmd.exe',['/d','/s','/c','npm run build'],target):run('local.npm.build','npm',['run','build'],target)}catch(e){const message=e instanceof Error?e.message:String(e);return{ok:false,action:'local.npm.build',error:message,data:{stderr:message,stdout:'',exitCode:null}}}}
