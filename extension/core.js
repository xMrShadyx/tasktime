/* Shared deterministic model. Times are observation times, never employer timestamps. */
(function(root){
const TYPES=['ball','player','single_player','live_dead','lineup','reid','away','home','refs'];
const fresh=()=>({schema:1,tasks:[],active:null,shifts:[],shift:null,clock:null,prompts:[],audit:[],lang:'bg',health:{}});
const uuid=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2)+Date.now();
const LEAGUES=['cbf1','dfd','dsl','efl','football','football-delayed','hpl','ligue1','ligue2','lkl','ncaa-mb','ncaa-wb','svk1l','uefa','wnba'];
const ID=/^[a-zA-Z0-9_-]{1,100}$/;
const PAGES=['next','config','mercury','generate','filters','summary','timing','queue'];
const SLUG=/^[a-z0-9_-]{1,40}$/;
const cleanList=x=>Array.isArray(x)?[...new Set(x.map(v=>String(v).trim().toLowerCase()).filter(v=>SLUG.test(v)))].slice(0,200):[];
// Extra lists come from the user's own Settings (s.custom) and from the site's config.json (s.remote).
function extraOf(s){const c=s?.custom||{},r=s?.remote||{};const m=k=>[...new Set([...cleanList(c[k]),...cleanList(r[k])])];return {leagues:m('leagues'),types:m('types'),pages:m('pages')}}
function taskFromURL(url,extra={}){try{const u=new URL(url);if(u.hostname!=='redstone.secondspectrum.com')return null;
 const leagues=[...LEAGUES,...(extra.leagues||[])],types=[...TYPES,...(extra.types||[])],pages=[...PAGES,...(extra.pages||[])];
 const seg=u.pathname.split('/').filter(Boolean).map(decodeURIComponent);const gi=seg[0]?.toLowerCase()==='global-tasks';
 const li=gi&&seg.length>=3?1:seg.findIndex(x=>leagues.includes(x.toLowerCase()));if(gi&&!/^[a-z0-9-]{1,40}$/i.test(seg[1]||''))return null;if(li<0)return null;
 const rest=seg.slice(li+1);if(!rest.length||rest.length>2)return null;const id=rest.at(-1);if(!ID.test(id)||pages.includes(id.toLowerCase()))return null;
 const raw=rest.length===2?rest[0].toLowerCase():null;const known=raw&&types.includes(raw);
 const r={league:seg[li].toLowerCase(),type:known?raw:'other',id};if(raw&&!known)r.rawType=raw.slice(0,40);return r}catch{return null}}
function prompt(s,kind,data={}){if(!s.prompts.some(p=>p.kind===kind&&p.shift===data.shift))s.prompts.push({id:uuid(),kind,...data})}
function currentShift(s){return s.shifts.find(x=>x.id===s.shift)}
function taskNow(s){return s.tasks.find(x=>x.key===s.active)}
function tickTask(t,now){if(!t)return;const dt=now-t.lastSeen;if(dt<0||dt>45000){if(dt!==0)t.gaps.push({from:t.lastSeen,to:now});}else t.observedMs+=dt;t.lastSeen=now;}
function endTask(s,now,reason){const t=taskNow(s);if(!t)return;tickTask(t,now);t.end=now;t.reason=reason;t.status=t.finishAt&&now-t.finishAt<=120000&&['next-task','left-task','tab-closed'].includes(reason)&&!t.blocked?'completed':'review';if(t.status==='completed'){t.observedMs=t.finishObservedMs;t.transitionMs=now-t.finishAt;}if(t.gaps.length||s.tasks.some(x=>x.key!==t.key&&x.id===t.id&&x.type===t.type&&x.status==='completed'))t.status='review';s.active=null;}
/* Work schedule (optional): a weekly template plus per-day entries (which override the template; off:true = day off).
   Times are "HH:MM"; an end not after the start means the shift ends the next day (night shift). */
const HM=/^([01]\d|2[0-3]):[0-5]\d$/;const TOL=5*60e3;
function cleanSchedule(x){const o={weekly:{},days:{},tolerance:5,since:Number(x?.since)||null};const w=x?.weekly||{};for(const k of ['0','1','2','3','4','5','6']){const d=w[k];if(d&&HM.test(d.start)&&HM.test(d.end))o.weekly[k]={start:d.start,end:d.end}}
 const ds=x?.days||{};for(const [k,d] of Object.entries(ds).slice(0,400)){if(!/^\d{4}-\d{2}-\d{2}$/.test(k))continue;if(d?.off)o.days[k]={off:true,source:d.source==='ximble'?'ximble':'manual'};else if(d&&HM.test(d.start)&&HM.test(d.end))o.days[k]={start:d.start,end:d.end,source:d.source==='ximble'?'ximble':'manual'}}return o}
function planForDate(s,key){const sc=s.schedule;if(!sc)return null;const d=sc.days?.[key]??sc.weekly?.[String(new Date(key+'T12:00').getDay())];if(!d||d.off)return null;
 const at=(k,hm)=>{const [h,m]=hm.split(':').map(Number);const t=new Date(k+'T00:00');t.setHours(h,m,0,0);return +t};const start=at(key,d.start);let end=at(key,d.end);if(end<=start){const n=new Date(end);n.setDate(n.getDate()+1);end=+n}
 return {date:key,start,end,source:sc.days?.[key]?(sc.days[key].source||'manual'):'weekly'}}
// The plan a moment belongs to: today's or yesterday's (night shift), whose window (±4 h around it) contains the moment; nearest start wins.
function planForTime(s,t){const keys=[-1,0,1].map(o=>{const d=new Date(t);d.setDate(d.getDate()+o);return dateKey(+d)});let best=null;for(const k of keys){const p=planForDate(s,k);if(!p||t<p.start-4*3600e3||t>p.end+4*3600e3)continue;if(!best||Math.abs(p.start-t)<Math.abs(best.start-t))best=p}return best}
function compareShift(s,sh){const p=sh.scheduled||planForTime(s,sh.start);if(!p)return null;const tol=(s.schedule?.tolerance??5)*60e3;const worked=sh.intervals.reduce((a,i)=>a+Math.max(0,(i.end||Date.now())-i.start),0);
 const startDiff=sh.start-p.start,endDiff=sh.end?sh.end-p.end:null;return {plan:p,startDiff,endDiff,late:startDiff>tol,early:endDiff!==null&&endDiff<-tol,over:endDiff!==null&&endDiff>tol,worked,planned:p.end-p.start}}
function missedPlans(s,days,now){const out=[];for(let i=days;i>=0;i--){const d=new Date(now);d.setDate(d.getDate()-i);const p=planForDate(s,dateKey(+d));if(!p||p.start>now||(s.schedule?.since&&p.start<s.schedule.since))continue;
 const hit=s.shifts.some(sh=>sh.start<p.end+4*3600e3&&(sh.end??now)>p.start-4*3600e3);if(!hit)out.push(p)}return out}
function clock(s,value,now){if(!['in','out'].includes(value))return;const prev=s.clock;const sh0=currentShift(s);if(sh0&&s.health.clockSeen&&now-s.health.clockSeen>45000){(sh0.gaps||=[]).push({from:s.health.clockSeen,to:now})}s.clock=value;s.health.clockSeen=now;if(prev===value)return;
 let sh=currentShift(s);
 if(value==='in'){
  if(!sh){sh={id:uuid(),start:now,end:null,planned:null,intervals:[],breaks:[],overtime:false,inferredStart:prev===null};s.shifts.push(sh);s.shift=sh.id;const pl=planForTime(s,now);if(pl){sh.planned=pl.end;sh.scheduled={start:pl.start,end:pl.end}}else prompt(s,'plan',{shift:sh.id,at:now})}
  const br=sh.breaks.at(-1);if(br&&!br.end)br.end=now;
  if(!sh.intervals.some(i=>!i.end))sh.intervals.push({start:now,end:null,observedStart:prev===null});
 }else if(sh){const i=sh.intervals.at(-1);if(i&&!i.end)i.end=now;prompt(s,'clock-out',{shift:sh.id,at:now})}
}
function planTime(start,hhmm){if(!/^\d{2}:\d{2}$/.test(hhmm))throw Error('Invalid time');const [h,m]=hhmm.split(':').map(Number);if(h>23||m>59)throw Error('Invalid time');const d=new Date(start);d.setHours(h,m,0,0);if(d.getTime()<=start)d.setDate(d.getDate()+1);return d.getTime()}
function answer(s,id,value,now){const p=s.prompts.find(x=>x.id===id);if(!p)throw Error('Question no longer pending');const sh=s.shifts.find(x=>x.id===p.shift);if(!sh)throw Error('Shift missing');
 if(p.kind==='plan'){sh.planned=planTime(sh.start,value)}
 else if(p.kind==='clock-out'){
  if(!['break','finish'].includes(value))throw Error('Invalid answer');
  if(value==='break'){const next=sh.intervals.find(i=>i.start>p.at);if(!sh.breaks.some(b=>b.start===p.at))sh.breaks.push({start:p.at,end:next?.start||null});}
  else {sh.end=p.at;s.prompts=s.prompts.filter(q=>q.shift!==sh.id);if(s.shift===sh.id)s.shift=null;
   // An answer can arrive after work resumed: split the later intervals into a new shift.
   const later=sh.intervals.filter(i=>i.start>p.at);sh.intervals=sh.intervals.filter(i=>i.start<=p.at);
   if(later.length){const n={id:uuid(),start:later[0].start,end:null,planned:null,intervals:later,breaks:[],overtime:false,inferredStart:false};s.shifts.push(n);s.shift=n.id;prompt(s,'plan',{shift:n.id,at:n.start});if(s.clock==='out')prompt(s,'clock-out',{shift:n.id,at:later.at(-1).end||now})}
  }
 }else if(p.kind==='overtime'){
  if(!['overtime','finish'].includes(value))throw Error('Invalid answer');sh.overtime=value==='overtime';sh.endChoice=value;
  if(value==='finish'&&s.clock==='in')prompt(s,'reminder',{shift:sh.id,at:now});
 }else if(p.kind==='reminder'){if(s.clock==='in')throw Error('Clock Out in Ximble first')}
 s.audit.push({at:now,kind:'answer',question:p.kind,eventAt:p.at,value});s.prompts=s.prompts.filter(x=>x.id!==id);
}
/* Manual shift correction. Working intervals are rebuilt as [start, end] minus the breaks, so totals stay consistent. */
function editShift(s,id,c,now){const sh=s.shifts.find(x=>x.id===id);if(!sh)throw Error('Shift missing');
 const num=v=>v===null||v===''||v===undefined?null:Number(v);const start=num(c.start)??sh.start,end=c.end===undefined?sh.end:num(c.end),planned=c.planned===undefined?sh.planned:num(c.planned);
 const current=s.shift===sh.id;if(!Number.isFinite(start))throw Error('bad-start');if(end!==null&&!(end>start))throw Error('bad-end');if(end===null&&!current)throw Error('end-required');if(planned!==null&&!(planned>start))throw Error('bad-planned');
 const limit=end??now;const breaks=(c.breaks===undefined?sh.breaks:c.breaks).map(b=>({start:num(b.start),end:num(b.end)})).filter(b=>!(b.end!==null&&b.end===b.start)).sort((a,b)=>a.start-b.start);
 breaks.forEach((b,i)=>{if(!Number.isFinite(b.start)||b.start<start||b.start>limit)throw Error('bad-break');if(b.end!==null&&(!(b.end>b.start)||b.end>limit))throw Error('bad-break');if(b.end===null&&(i<breaks.length-1||end!==null))throw Error('bad-break');if(i&&breaks[i-1].end>b.start)throw Error('break-overlap')});
 s.audit.push({at:now,kind:'shift-edit',previous:JSON.parse(JSON.stringify(sh))});
 const iv=[];let cur=start;for(const b of breaks){if(b.start>cur)iv.push({start:cur,end:b.start});cur=b.end??null;if(cur===null)break}if(cur!==null&&(end===null||end>cur))iv.push({start:cur,end});
 Object.assign(sh,{start,end,planned,breaks,intervals:iv,edited:true});if(typeof c.overtime==='boolean')sh.overtime=c.overtime;
 if(end!==null&&current){s.shift=null;s.prompts=s.prompts.filter(p=>p.shift!==sh.id)}
 if(planned!==null&&planned>now)s.prompts=s.prompts.filter(p=>!(p.shift===sh.id&&p.kind==='overtime'));if(planned!==sh.planned||c.planned!==undefined)s.prompts=s.prompts.filter(p=>!(p.shift===sh.id&&p.kind==='plan'))}
function reduce(s,e){const now=e.at;
 if(e.kind==='task-observe'){
  const info=taskFromURL(e.url,extraOf(s));s.health.taskSeen=now;if(info?.rawType){s.unknown||={};s.unknown[info.rawType]=Date.now()}let t=taskNow(s);
  if(t&&t.owner!==e.tab){if(!e.visible)return s;endTask(s,now,'tab-conflict');t=null;}
  if(t&&(t.id!==info?.id||t.type!==info?.type||(t.league||'football')!==info?.league)){endTask(s,now,info?'next-task':'left-task');t=null;}
  if(info&&!t){t={key:uuid(),...info,owner:e.tab,start:now,lastSeen:now,observedMs:0,gaps:[],status:'active',shift:s.shift,finishAt:null};s.tasks.push(t);s.active=t.key;}
  else if(t)tickTask(t,now);
 }
 if(e.kind==='finish'){const t=taskNow(s);if(t&&t.owner===e.tab){tickTask(t,now);t.finishAt=now;t.finishObservedMs=t.observedMs;t.finishKind=e.finishKind;t.blocked=false}}
 if(e.kind==='post-qa'){const t=taskNow(s);if(t&&t.owner===e.tab)t.postQa=true}
 if(e.kind==='task-error'){const t=taskNow(s);if(t&&t.owner===e.tab)t.blocked=true}
 if(e.kind==='tab-closed'){const t=taskNow(s);if(t?.owner===e.tab)endTask(s,now,'tab-closed')}
 if(e.kind==='clock')clock(s,e.value,now);
 if(e.kind==='answer')answer(s,e.id,e.value,now);
 if(e.kind==='edit-shift')editShift(s,e.id,e.changes||{},now);
 if(e.kind==='delete-shift'){const sh=s.shifts.find(x=>x.id===e.id);if(!sh)throw Error('Shift missing');s.audit.push({at:now,kind:'shift-delete',previous:JSON.parse(JSON.stringify(sh))});s.shifts=s.shifts.filter(x=>x!==sh);s.prompts=s.prompts.filter(p=>p.shift!==sh.id);if(s.shift===sh.id)s.shift=null}
 if(e.kind==='correct-task'){const t=s.tasks.find(x=>x.key===e.key);if(!t||t.status==='active')throw Error('Task is active or missing');if(!['completed','excluded'].includes(e.status))throw Error('Invalid status');s.audit.push({at:now,kind:'correction',key:t.key,previous:t.status,status:e.status});t.status=e.status;t.corrected=true;}
 const sh=currentShift(s);if(sh?.planned&&now>=sh.planned&&s.clock==='in'&&!sh.endChoice)prompt(s,'overtime',{shift:sh.id,at:sh.planned});
 if(s.clock==='out')s.prompts=s.prompts.filter(p=>p.kind!=='reminder');
 return s;
}
function dateKey(ms){const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
const statKey=t=>t.type+(t.postQa?' · Post QA':'');
function stats(s,from,to){const done=s.tasks.filter(t=>t.status==='completed'&&t.end&&dateKey(t.end)>=from&&dateKey(t.end)<=to);
 const base=[...new Set([...TYPES,...extraOf(s).types,'other'])];const keys=[];for(const k of base){keys.push(k);if(done.some(t=>t.postQa&&t.type===k))keys.push(k+' · Post QA')}
 return keys.map(type=>{const values=done.filter(t=>statKey(t)===type).map(t=>t.observedMs);const total=values.reduce((a,b)=>a+b,0);return {type,count:values.length,total,min:values.length?Math.min(...values):null,max:values.length?Math.max(...values):null,avg:values.length?total/values.length:null}})}
const ALERT={sound:true,volume:0.6,notify:false};
function alertSettings(s){const a={...ALERT,...(s.alert||{})};return {sound:!!a.sound,volume:Math.max(0,Math.min(1,Number(a.volume)||0)),notify:!!a.notify}}
const TIPS={postQaChunks:true};
function tipsSettings(s){const t={...TIPS,...(s?.tips||{})};return {postQaChunks:!!t.postQaChunks}}
const api={cleanSchedule,planForDate,planForTime,compareShift,missedPlans,editShift,alertSettings,tipsSettings,TYPES,LEAGUES,PAGES,extraOf,cleanList,fresh,reduce,taskFromURL,planTime,dateKey,stats};if(typeof module!=='undefined')module.exports=api;root.TaskTime=api;
})(globalThis);
