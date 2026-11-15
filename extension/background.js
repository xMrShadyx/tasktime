importScripts('core.js');
let queue=Promise.resolve();
const read=async()=> (await chrome.storage.local.get('tasktime')).tasktime||TaskTime.fresh();
async function badge(s){
 const shift=s.shifts.find(x=>x.id===s.shift);
 const color=s.clock==='in'?'green':s.clock==='out'&&shift&&!shift.end&&shift.breaks.some(b=>!b.end)?'orange':'red';
 await chrome.action.setIcon({path:{16:'icons/'+color+'16.png',32:'icons/'+color+'32.png'}});
 await chrome.action.setBadgeBackgroundColor({color:'#245c4b'});await chrome.action.setBadgeText({text:s.prompts.length?String(s.prompts.length):s.tasks.some(t=>t.status==='review')?'!':''})}
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
  if(m.kind==='alert-settings'&&ownPage){const s=await read();s.alert=TaskTime.alertSettings({alert:m.alert});await chrome.storage.local.set({tasktime:s});return s.alert}
  if(m.kind==='test-sound'&&ownPage){await beep(TaskTime.alertSettings(await read()).volume,sender.tab?.id);return {ok:true}}
  if(m.kind==='correct-task'&&ownPage)return apply({kind:m.kind,key:m.key,status:m.status,at:Date.now()});
  if(!sender.tab||sender.frameId!==0)return {error:'Unsupported request'};
  const url=new URL(sender.url);const e={at:Date.now(),tab:sender.tab.id};
  if(url.hostname==='redstone.secondspectrum.com'){
   if(m.kind==='task-observe'){const before=(await read()).active;const s=await apply({...e,kind:m.kind,url:sender.url,visible:!!m.visible});if(s.active&&s.active!==before)newTaskAlert(sender.tab,s).catch(console.error);return s}
   if(m.kind==='alert-beep'){const cfg=TaskTime.alertSettings(await read());if(cfg.sound)await beep(cfg.volume,sender.tab.id);return {ok:true}}
   if(m.kind==='alert-clear'){chrome.notifications?.clear('tasktime-new-task');return {ok:true}}
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
chrome.runtime.onInstalled.addListener(()=>serialized(boot).catch(console.error));chrome.runtime.onStartup.addListener(()=>serialized(boot).catch(console.error));serialized(boot).catch(console.error);

/* New-task alert: chime when a new task opens while its tab is not in focus; repeat every 10 s until focused. */
async function tabFocused(tabId){try{const t=await chrome.tabs.get(tabId);if(!t.active)return false;return (await chrome.windows.get(t.windowId)).focused}catch{return null}}
async function beep(volume,tabId){
 if(chrome.offscreen){try{if(!(await chrome.offscreen.hasDocument?.()))await chrome.offscreen.createDocument({url:'offscreen.html',reasons:['AUDIO_PLAYBACK'],justification:'Short sound when a new task is available'})}catch(err){if(!/single offscreen|already/i.test(err.message))console.warn(err)}
  try{await chrome.runtime.sendMessage({target:'offscreen',kind:'beep',volume});return}catch(err){console.warn(err)}}
 if(tabId!=null)await chrome.tabs.sendMessage(tabId,{kind:'beep-page',volume}).catch(()=>{});
}
async function notifyNewTask(tab,s,task){if(!chrome.notifications)return;listenNotifications();const en=s.lang==='en';
 await chrome.notifications.create('tasktime-new-task',{type:'basic',iconUrl:'icons/icon128.png',title:en?'New task':'Нова задача',message:[task?.league,task?.type].filter(Boolean).join(' · ')||'Redstone',priority:2});
 notifyTab=tab}
let notifyTab=null;
let notifyListening=false;
function listenNotifications(){if(notifyListening||!chrome.notifications)return;notifyListening=true;chrome.notifications.onClicked.addListener(async id=>{if(id!=='tasktime-new-task'||!notifyTab)return;try{await chrome.tabs.update(notifyTab.id,{active:true});await chrome.windows.update(notifyTab.windowId,{focused:true})}catch{}chrome.notifications.clear(id)})}
listenNotifications();chrome.permissions.onAdded.addListener(listenNotifications);
async function newTaskAlert(tab,s){
 const cfg=TaskTime.alertSettings(s);if(await tabFocused(tab.id)!==false)return;
 await chrome.tabs.sendMessage(tab.id,{kind:'stage-green'}).catch(()=>{});
 if(cfg.sound)await beep(cfg.volume,tab.id);
 if(cfg.notify)await notifyNewTask(tab,s,s.tasks.find(t=>t.key===s.active)).catch(console.warn);
}
