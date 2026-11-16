let state;let lang='bg';let tab='today';const $=id=>document.getElementById(id);
const W={bg:{tabs:{today:'Днес',stats:'Статистика',shifts:'Смени',review:'За преглед',history:'История',settings:'Настройки'},
status:{in:'На смяна',break:'В почивка',out:'Извън смяна'},
kpi:['Завършени задачи','Време в задачи','Средно на задача','Работено време'],
todayTypes:'Задачи днес по тип',shiftNow:'Текуща смяна',recent:'Последни задачи',noShift:'В момента не си на смяна.',
started:'Начало',planned:'Планиран край',worked:'Работено',breaks:'Почивки',overtime:'След планирания край',ended:'Край',open:'продължава',
otYes:'overtime потвърден',otNo:'overtime не е потвърден',
presets:[['today','Днес'],['week','7 дни'],['month','Този месец']],from:'От',to:'До',csv:'Свали CSV',heads:['Тип','Брой','Най-бърза','Най-бавна','Средно','Общо'],total:'Общо',
statsNote:'Броят се само завършените задачи, по датата на завършване. Времето е ч:мм:сс.',
reviewNote:'TaskTime не е сигурен, че тези задачи са приключили нормално. Потвърди ги, за да влязат в статистиката, или ги изключи.',
search:'Търси по тип, лига или ID…',
reasons:{'next-task':'мина към следваща задача','left-task':'напусна задачата','tab-closed':'затворен таб','tab-conflict':'отворена в друг таб'},
noFinish:'без Finish / Clear Samples',gaps:n=>`${n} прекъсвания`,
confirm:'Потвърди',exclude:'Изключи',status_:{active:'Активна',completed:'Завършена',review:'За преглед',excluded:'Изключена'},corrected:'ръчно',
alertTitle:'Сигнал за нова задача',alertNote:'🟢 при нова задача, докато не гледаш Redstone · 🟠 при „Are you still active?“ · 🔴 когато остават 5 секунди.',alertSound:'Звуков сигнал',alertVolume:'Сила на звука',alertTest:'Пробвай звука',alertNotify:'Известие в системата',alertDenied:'Браузърът не позволи известия.',
dataTitle:'Твоите данни',dataNote:'Записите стоят само в този браузър. Ако премахнеш добавката, изтриеш или преместиш папката ѝ, те се губят. Първо свали архив, а след новата инсталация го възстанови.',backup:'Свали архив (JSON)',restore:'Възстанови от архив',restoreAsk:'Записите в отчета ще бъдат заменени с тези от архива. Продължи?',restored:(t,s)=>`Възстановени: ${t} задачи, ${s} смени.`,badBackup:'Файлът не е валиден архив на TaskTime.',
q:{plan:'До колко часа е смяната ти?',out:'Почивка или приключваш работа?',over:'Планираната смяна приключи. Още ли работиш?',reminder:'Направи Clock Out в Ximble, за да се потвърди краят.'},
upd:v=>`Има нова версия ${v}`,updHow:'Свали я от сайта и я разархивирай върху сегашната папка (замени файловете). TaskTime ще се презареди сам до минута — записите ти остават.',updGo:'Към сайта',verTitle:'Версия',verNote:v=>`Инсталирана е версия ${v}. TaskTime проверява за нова версия няколко пъти на ден.`,verCheck:'Провери сега',verLatest:'Имаш последната версия.',save:'Запази',break:'Почивка',finish:'Приключвам',ot:'Продължавам с overtime',endDate:'Край',empty:'Още няма записи.',saved:'Запазено',invalid:'Избери валиден период.'},
en:{tabs:{today:'Today',stats:'Statistics',shifts:'Shifts',review:'To review',history:'History',settings:'Settings'},
status:{in:'On shift',break:'On a break',out:'Off shift'},
kpi:['Completed tasks','Time in tasks','Average per task','Time worked'],
todayTypes:'Today’s tasks by type',shiftNow:'Current shift',recent:'Recent tasks',noShift:'You are not on shift right now.',
started:'Start',planned:'Planned end',worked:'Worked',breaks:'Breaks',overtime:'After planned end',ended:'End',open:'ongoing',
otYes:'overtime confirmed',otNo:'overtime not confirmed',
presets:[['today','Today'],['week','7 days'],['month','This month']],from:'From',to:'To',csv:'Download CSV',heads:['Type','Count','Fastest','Slowest','Average','Total'],total:'Total',
statsNote:'Only completed tasks count, by completion date. Time is h:mm:ss.',
reviewNote:'TaskTime is not sure these tasks finished normally. Confirm them to include them in statistics, or exclude them.',
search:'Search by type, league or ID…',
reasons:{'next-task':'moved to next task','left-task':'left the task','tab-closed':'tab closed','tab-conflict':'opened in another tab'},
noFinish:'no Finish / Clear Samples',gaps:n=>`${n} interruptions`,
confirm:'Confirm',exclude:'Exclude',status_:{active:'Active',completed:'Completed',review:'To review',excluded:'Excluded'},corrected:'manual',
alertTitle:'New task alert',alertNote:'🟢 on a new task while you are not looking at Redstone · 🟠 on “Are you still active?” · 🔴 when 5 seconds are left.',alertSound:'Sound alert',alertVolume:'Volume',alertTest:'Test sound',alertNotify:'System notification',alertDenied:'The browser did not allow notifications.',
dataTitle:'Your data',dataNote:'Records are stored only in this browser. Removing the extension, or deleting or moving its folder, loses them. Download a backup first and restore it after reinstalling.',backup:'Download backup (JSON)',restore:'Restore from backup',restoreAsk:'Your report will be replaced with the records from the backup. Continue?',restored:(t,s)=>`Restored: ${t} tasks, ${s} shifts.`,badBackup:'This file is not a valid TaskTime backup.',
q:{plan:'What time does your shift end?',out:'Taking a break or finishing work?',over:'Your planned shift has ended. Still working?',reminder:'Clock Out in Ximble to confirm the end.'},
upd:v=>`New version ${v} is available`,updHow:'Download it from the site and extract it over the current folder (replace the files). TaskTime reloads itself within a minute — your records stay.',updGo:'Go to site',verTitle:'Version',verNote:v=>`Version ${v} is installed. TaskTime checks for a new version a few times a day.`,verCheck:'Check now',verLatest:'You have the latest version.',save:'Save',break:'Take a break',finish:'Finish work',ot:'Continue with overtime',endDate:'End',empty:'No records yet.',saved:'Saved',invalid:'Choose a valid date range.'}};
const TABS=['today','stats','shifts','review','history','settings'];
const sec=ms=>Math.max(0,Math.round((ms||0)/1000));
const fmt=ms=>ms==null?'—':`${Math.floor(sec(ms)/3600)}:${String(Math.floor(sec(ms)/60)%60).padStart(2,'0')}:${String(sec(ms)%60).padStart(2,'0')}`;
const short=ms=>{if(ms==null)return '—';const s=sec(ms),h=Math.floor(s/3600),m=Math.floor(s/60)%60;return h?`${h}${lang==='bg'?'ч':'h'} ${m}${lang==='bg'?'м':'m'}`:`${m}:${String(s%60).padStart(2,'0')}`};
const loc=()=>lang==='bg'?'bg-BG':'en-GB';
const dt=ms=>ms?new Date(ms).toLocaleString(loc(),{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
const hm=ms=>ms?new Date(ms).toLocaleTimeString(loc(),{hour:'2-digit',minute:'2-digit'}):'—';
const el=(tag,props={},...kids)=>{const e=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==='class')e.className=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e[k]=v}for(const k of kids.flat())if(k!=null)e.append(k);return e};
async function request(m){const r=await chrome.runtime.sendMessage(m);if(r?.error)throw Error(r.error);return r.result}
let msgTimer;function message(t){$('message').textContent=t;clearTimeout(msgTimer);msgTimer=setTimeout(()=>$('message').textContent='',4000)}
async function mutate(m){try{await request(m);await load();message(W[lang].saved)}catch(e){message(e.message)}}
function download(name,text,type){const u=URL.createObjectURL(new Blob([text],{type}));el('a',{href:u,download:name}).click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
const today=()=>TaskTime.dateKey(Date.now());
const shiftOf=s=>s.shifts.find(x=>x.id===s.shift);
const sumIntervals=(xs,from=0)=>xs.reduce((a,i)=>a+Math.max(0,(i.end||Date.now())-Math.max(i.start,from)),0);
function clockState(){const sh=shiftOf(state);if(state.clock==='in')return 'in';if(sh&&!sh.end&&sh.breaks.some(b=>!b.end))return 'break';return 'out'}

function drawChrome(){const w=W[lang];document.documentElement.lang=lang;document.querySelectorAll('#lang button').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.lang===lang)));
 const cs=clockState();$('status').className='status '+cs;$('status').replaceChildren(el('i'),w.status[cs]);
 const nReview=state.tasks.filter(t=>t.status==='review').length;
 $('tabs').replaceChildren(...TABS.map(t=>el('button',{role:'tab',ariaSelected:String(t===tab),onclick:()=>{tab=t;try{localStorage.setItem('tt-tab',t)}catch{}draw()}},w.tabs[t],t==='review'&&nReview?el('span',{class:'count',textContent:nReview}):null)));
 document.querySelectorAll('section[data-tab]').forEach(s=>s.classList.toggle('on',s.dataset.tab===tab))}

function drawQuestions(){const w=W[lang];const box=$('questions');if(box.contains(document.activeElement))return;box.replaceChildren();
 for(const p of state.prompts){const q=el('div',{class:'question'},el('h3',{textContent:w.q[{plan:'plan','clock-out':'out',overtime:'over',reminder:'reminder'}[p.kind]]}),el('p',{textContent:dt(p.at)}));
  const btn=(text,value,ghost)=>q.append(el('button',{class:ghost?'ghost':'',textContent:text,onclick:()=>mutate({kind:'answer',id:p.id,value:typeof value==='function'?value():value})}));
  if(p.kind==='plan'){const input=el('input',{type:'time'});const prev=el('span',{class:'hint'});input.oninput=()=>{try{prev.textContent=w.endDate+': '+dt(TaskTime.planTime(p.at,input.value))}catch{prev.textContent=''}};q.append(input);btn(w.save,()=>input.value);q.append(prev)}
  if(p.kind==='clock-out'){btn(w.break,'break');btn(w.finish,'finish',true)}
  if(p.kind==='overtime'){btn(w.ot,'overtime');btn(w.finish,'finish',true)}
  box.append(q)}}

function taskItem(t,actions){const w=W[lang];const why=[];if(t.reason&&t.status!=='completed')why.push(w.reasons[t.reason]||t.reason);if(!t.finishAt&&t.status==='review')why.push(w.noFinish);if(t.gaps?.length)why.push(w.gaps(t.gaps.length));
 const it=el('div',{class:'item'},el('div',{class:'main'},el('div',{},el('b',{textContent:t.type}),' ',el('span',{class:'chip '+t.status,textContent:w.status_[t.status]+(t.corrected?' · '+w.corrected:'')})),el('small',{textContent:`${t.league||'football'} · ${dt(t.start)} → ${t.end?hm(t.end):'…'}${why.length?' · '+why.join(', '):''}`,title:t.id})),el('span',{class:'dur',textContent:fmt(t.observedMs)}));
 if(actions){it.append(el('button',{textContent:w.confirm,onclick:()=>mutate({kind:'correct-task',key:t.key,status:'completed'})}),el('button',{class:'danger',textContent:w.exclude,onclick:()=>mutate({kind:'correct-task',key:t.key,status:'excluded'})}))}
 return it}
const empty=()=>el('div',{class:'empty',textContent:W[lang].empty});

function drawToday(){const w=W[lang];const k=today();const done=state.tasks.filter(t=>t.status==='completed'&&t.end&&TaskTime.dateKey(t.end)===k);const total=done.reduce((a,t)=>a+t.observedMs,0);
 const sh=shiftOf(state)||[...state.shifts].reverse().find(s=>TaskTime.dateKey(s.start)===k);const worked=sh?sumIntervals(sh.intervals):null;
 $('kpis').replaceChildren(...[[done.length,w.kpi[0]],[short(total),w.kpi[1]],[done.length?short(total/done.length):'—',w.kpi[2]],[worked==null?'—':short(worked),w.kpi[3]]].map(([v,l])=>el('div',{class:'kpi'},el('b',{textContent:v}),el('span',{textContent:l}))));
 $('todayTypesTitle').textContent=w.todayTypes;const by={};for(const t of done)by[t.type]=(by[t.type]||0)+1;const max=Math.max(1,...Object.values(by));
 $('todayTypes').replaceChildren(...(Object.keys(by).length?Object.entries(by).sort((a,b)=>b[1]-a[1]).map(([type,n])=>el('div',{class:'bar'},el('span',{textContent:type}),el('div',{},el('i',{style:`width:${n/max*100}%`})),el('b',{textContent:n}))):[empty()]));
 $('shiftNowTitle').textContent=w.shiftNow;$('shiftNow').replaceChildren(shiftOf(state)?shiftFacts(shiftOf(state)):el('p',{class:'hint',textContent:w.noShift}));
 $('recentTitle').textContent=w.recent;const recent=state.tasks.slice(-8).reverse();$('recent').replaceChildren(...(recent.length?recent.map(t=>taskItem(t)):[empty()]))}

function shiftFacts(sh){const w=W[lang];const breaks=sumIntervals(sh.breaks);const after=sh.planned?sumIntervals(sh.intervals,sh.planned):null;
 return el('div',{class:'facts'},...[[w.started,dt(sh.start)],[w.planned,sh.planned?hm(sh.planned):'—'],[w.worked,fmt(sumIntervals(sh.intervals))],[w.breaks,fmt(breaks)],[w.overtime,after==null?'—':fmt(after)]].map(([a,b])=>el('div',{},el('span',{textContent:a}),el('b',{textContent:b}))))}

let preset='today';
function setPreset(p){preset=p;const d=new Date();let from=today();if(p==='week'){d.setDate(d.getDate()-6);from=TaskTime.dateKey(+d)}if(p==='month'){d.setDate(1);from=TaskTime.dateKey(+d)}$('from').value=from;$('to').value=today();drawStats()}
function validRange(){return $('from').value&&$('to').value&&$('from').value<=$('to').value}
function drawStats(){const w=W[lang];$('presets').replaceChildren(...w.presets.map(([k,l])=>el('button',{class:k===preset?'on':'',textContent:l,onclick:()=>setPreset(k)})));
 $('fromLabel').textContent=w.from;$('toLabel').textContent=w.to;$('csv').textContent=w.csv;$('statsNote').textContent=w.statsNote;
 if(!validRange()){message(w.invalid);return}const rows=TaskTime.stats(state,$('from').value,$('to').value).filter(r=>r.count||TaskTime.TYPES.includes(r.type));
 $('head').replaceChildren(el('tr',{},...w.heads.map(h=>el('th',{textContent:h}))));
 $('rows').replaceChildren(...rows.map(r=>el('tr',{class:r.count?'':'zero'},...[r.type,r.count,fmt(r.min),fmt(r.max),fmt(r.avg),fmt(r.total)].map(x=>el('td',{textContent:x})))));
 const n=rows.reduce((a,r)=>a+r.count,0),tot=rows.reduce((a,r)=>a+r.total,0);$('foot').replaceChildren(el('tr',{},...[w.total,n,'','',n?fmt(tot/n):'—',fmt(tot)].map(x=>el('td',{textContent:x}))))}

function drawShifts(){const w=W[lang];const list=[...state.shifts].reverse();$('shifts').replaceChildren(...(list.length?list.map(sh=>el('div',{class:'card shift'},el('div',{class:'head'},el('h3',{textContent:`${dt(sh.start)} → ${sh.end?hm(sh.end):w.open}`}),el('small',{textContent:sh.planned?(sh.overtime?w.otYes:(sh.endChoice?w.otNo:'')):''})),shiftFacts(sh))):[empty()]))}
function drawReview(){const w=W[lang];$('reviewNote').textContent=w.reviewNote;const r=state.tasks.filter(t=>t.status==='review').slice(-200).reverse();$('review').replaceChildren(...(r.length?r.map(t=>taskItem(t,true)):[empty()]))}
function drawHistory(){const w=W[lang];$('search').placeholder=w.search;const q=$('search').value.trim().toLowerCase();const list=state.tasks.slice().reverse().filter(t=>!q||[t.type,t.league,t.id].some(x=>String(x||'').toLowerCase().includes(q))).slice(0,200);$('history').replaceChildren(...(list.length?list.map(t=>taskItem(t)):[empty()]))}

function drawSettings(){const w=W[lang],a=TaskTime.alertSettings(state);for(const id of ['alertTitle','alertNote','dataTitle','dataNote','backup','restore'])$(id).textContent=w[id];$('alertSoundLabel').textContent=w.alertSound;$('alertVolumeLabel').textContent=w.alertVolume;$('alertTest').textContent=w.alertTest;$('alertNotifyLabel').textContent=w.alertNotify;
 $('verTitle').textContent=w.verTitle;$('verNote').textContent=w.verNote(chrome.runtime.getManifest().version);$('verCheck').textContent=w.verCheck;$('alertSound').checked=a.sound;$('alertVolume').value=a.volume;volFill();$('alertVolume').disabled=!a.sound;$('alertNotify').checked=a.notify}
async function saveAlert(change){try{state.alert=await request({kind:'alert-settings',alert:{...TaskTime.alertSettings(state),...change}});drawSettings();message(W[lang].saved)}catch(e){message(e.message)}}

const isNewer=(a,b)=>{const x=String(a).split('.').map(Number),y=String(b).split('.').map(Number);for(let i=0;i<Math.max(x.length,y.length);i++){if((x[i]||0)!==(y[i]||0))return (x[i]||0)>(y[i]||0)}return false};
function drawUpdate(){const w=W[lang],u=state.update&&isNewer(state.update.version,chrome.runtime.getManifest().version)?state.update:null;$('update').replaceChildren(...(u?[el('div',{class:'update'},el('b',{textContent:w.upd(u.version)}),el('span',{textContent:w.updHow}),el('a',{href:u.url,target:'_blank',rel:'noopener',textContent:w.updGo+' →'}))]:[]))}
function draw(){drawChrome();drawUpdate();drawQuestions();({today:drawToday,stats:drawStats,shifts:drawShifts,review:drawReview,history:drawHistory,settings:drawSettings})[tab]()}
async function load(){state=await request({kind:'get'});lang=state.lang||'bg';draw()}

try{const t=localStorage.getItem('tt-tab');if(TABS.includes(t))tab=t}catch{}
$('from').value=$('to').value=today();$('from').onchange=$('to').onchange=()=>{preset='';drawStats()};
document.querySelectorAll('#lang button').forEach(b=>b.onclick=()=>{if(b.dataset.lang!==lang)mutate({kind:'language',lang:b.dataset.lang})});
const volFill=()=>{const v=$('alertVolume');v.style.setProperty('--p',(v.value*100)+'%');$('alertVolumeOut').textContent=Math.round(v.value*100)+'%'};$('alertVolume').addEventListener('input',volFill);
$('search').oninput=drawHistory;
$('csv').onclick=()=>{if(!validRange())return message(W[lang].invalid);const rows=[['type','count','fastest_seconds','slowest_seconds','average_seconds','total_seconds','from','to','timezone'],...TaskTime.stats(state,$('from').value,$('to').value).map(r=>[r.type,r.count,r.min==null?'':r.min/1000,r.max==null?'':r.max/1000,r.avg==null?'':r.avg/1000,r.total/1000,$('from').value,$('to').value,Intl.DateTimeFormat().resolvedOptions().timeZone])];download(`TaskTime-${$('from').value}-${$('to').value}.csv`,'﻿'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n'),'text/csv;charset=utf-8')};
$('backup').onclick=()=>download(`TaskTime-backup-${today()}.json`,JSON.stringify(state,null,2),'application/json');
$('verCheck').onclick=async()=>{try{const u=await request({kind:'check-update'});await load();message(u?W[lang].upd(u.version):W[lang].verLatest)}catch(e){message(e.message)}};
$('restore').onclick=()=>$('restoreFile').click();
$('restoreFile').onchange=async()=>{const f=$('restoreFile').files[0];$('restoreFile').value='';if(!f)return;const w=W[lang];let data;try{data=JSON.parse(await f.text())}catch{return message(w.badBackup)}if(!confirm(w.restoreAsk))return;try{const r=await request({kind:'restore',data});await load();message(w.restored(r.tasks,r.shifts))}catch(e){message(e.message==='invalid-backup'?w.badBackup:e.message)}};
$('alertSound').onchange=()=>saveAlert({sound:$('alertSound').checked});$('alertVolume').onchange=()=>saveAlert({volume:Number($('alertVolume').value)});$('alertTest').onclick=()=>request({kind:'test-sound'}).catch(e=>message(e.message));
$('alertNotify').onchange=async()=>{const on=$('alertNotify').checked;if(on){let ok=false;try{ok=await chrome.permissions.request({permissions:['notifications']})}catch{}if(!ok){$('alertNotify').checked=false;return message(W[lang].alertDenied)}}else chrome.permissions.remove({permissions:['notifications']}).catch(()=>{});saveAlert({notify:on})};
chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.tasktime){state=changes.tasktime.newValue;lang=state.lang||'bg';if(document.activeElement?.id==='search')return drawChrome();draw()}});
setInterval(()=>{if(state&&tab==='today')drawToday()},30000);
load().catch(e=>message(e.message));
