importScripts('core.js');
let queue=Promise.resolve();
const read=async()=> (await chrome.storage.local.get('tasktime')).tasktime||TaskTime.fresh();
async function badge(s){await chrome.action.setBadgeBackgroundColor({color:'#245c4b'});await chrome.action.setBadgeText({text:s.prompts.length?String(s.prompts.length):s.tasks.some(t=>t.status==='review')?'!':''})}
function serialized(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result}
async function apply(e){const s=await read();TaskTime.reduce(s,e);await chrome.storage.local.set({tasktime:s});await badge(s);return s}
chrome.runtime.onMessage.addListener((m,sender,reply)=>{
 if(sender.id!==chrome.runtime.id)return;
 const ownPage=sender.url?.startsWith(chrome.runtime.getURL(''));
 serialized(async()=>{
  if(m.kind==='get'){const s=await read();return ownPage?s:{prompts:s.prompts,lang:s.lang,clock:s.clock}}
  if(m.kind==='open'){await chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')});return {ok:true}}
  if(m.kind==='language'&&ownPage){const s=await read();s.lang=m.lang==='en'?'en':'bg';await chrome.storage.local.set({tasktime:s});return {ok:true}}
  if(m.kind==='answer'&&(ownPage||sender.tab))return apply({kind:'answer',id:m.id,value:String(m.value).slice(0,20),at:Date.now()});
  if(m.kind==='correct-task'&&ownPage)return apply({kind:m.kind,key:m.key,status:m.status,at:Date.now()});
  if(!sender.tab||sender.frameId!==0)return {error:'Unsupported request'};
  const url=new URL(sender.url);const e={at:Date.now(),tab:sender.tab.id};
  if(url.hostname==='redstone.secondspectrum.com'){
   if(m.kind==='task-observe')return apply({...e,kind:m.kind,url:sender.url,visible:!!m.visible});
   if(['finish','task-error'].includes(m.kind))return apply({...e,kind:m.kind,finishKind:m.finishKind==='next'?'next':'exit'});
  }
  if(url.hostname==='app.ximble.com'&&m.kind==='clock'&&['in','out'].includes(m.value))return apply({...e,kind:'clock',value:m.value});
  return {error:'Unsupported request'};
 }).then(result=>reply({result}),err=>reply({error:err.message||'Could not save. Export a backup and check storage.'}));return true;
});
chrome.action.onClicked.addListener(()=>chrome.tabs.create({url:chrome.runtime.getURL('dashboard.html')}));
chrome.tabs.onRemoved.addListener(tab=>serialized(()=>apply({kind:'tab-closed',tab,at:Date.now()})).catch(console.error));
chrome.alarms.onAlarm.addListener(()=>serialized(()=>apply({kind:'tick',at:Date.now()})).catch(console.error));
async function boot(){if(!await chrome.alarms.get('tasktime-tick'))await chrome.alarms.create('tasktime-tick',{periodInMinutes:1});await badge(await read())}
chrome.runtime.onInstalled.addListener(boot);chrome.runtime.onStartup.addListener(boot);boot().catch(console.error);
