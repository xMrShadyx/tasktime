(()=>{
let stopped=false;let panel;let shown='';let clockCandidate=null;let stableSince=0;let clockSent=null;let clockSentAt=0;let lastURL='';let lastObserve=0;let errorSent=false;
const isTasks=location.hostname==='redstone.secondspectrum.com';
async function send(m){if(stopped)return;try{const r=await chrome.runtime.sendMessage(m);if(r?.error)throw Error(r.error);return r?.result}catch(err){if(/context invalidated/i.test(err.message)){stopped=true;if(panel)panel.remove()}else console.warn('TaskTime:',err.message)}}
const visible=el=>!!(el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).display!=='none');
function clockValue(){const labels=[...document.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]')].filter(visible).filter(el=>!el.disabled&&el.getAttribute('aria-disabled')!=='true').map(el=>(el.value||el.textContent||'').trim().replace(/\s+/g,' ').toLowerCase());const out=labels.includes('clock out'),inside=labels.includes('clock in');return out!==inside?(out?'in':'out'):null}
function scanClock(){const val=clockValue();if(val!==clockCandidate){clockCandidate=val;stableSince=Date.now();clockSent=null}if(val&&Date.now()-stableSince>=2000&&(clockSent!==val||Date.now()-clockSentAt>=15000)){clockSent=val;clockSentAt=Date.now();send({kind:'clock',value:val})}}
const words={bg:{plan:'До колко часа е смяната ти?',out:'Почивка или приключваш работа?',over:'Планираната ти смяна приключи. Още ли работиш?',reminder:'Направи Clock Out в Ximble, за да се потвърди краят.',break:'Почивка',finish:'Приключвам',overtime:'Продължавам с overtime',save:'Запази',report:'Отчет',note:'Въпросът остава, докато отговориш. Часът на събитието е запазен.',next:'Край на смяната:',pending:'Личен отчет'},en:{plan:'What time does your shift end?',out:'Taking a break or finishing work?',over:'Your planned shift has ended. Are you still working?',reminder:'Clock Out in Ximble to confirm the end.',break:'Take a break',finish:'Finish work',overtime:'Continue with overtime',save:'Save',report:'Report',note:'This question stays until answered. The event time is preserved.',next:'Shift end:',pending:'Personal work log'}};
function element(tag,text){const e=document.createElement(tag);if(text)e.textContent=text;return e}
let pageLang='bg',tips={postQaChunks:true};
function render(s){pageLang=s.lang||'bg';if(s.tips)tips=s.tips;const p=s.prompts?.[0];if(!p){panel?.remove();panel=null;shown='';return}const sig=JSON.stringify([p,s.lang,s.clock]);if(shown===sig&&panel?.isConnected)return;shown=sig;panel?.remove();panel=element('div');panel.style.cssText='position:fixed;top:12px;left:12px;z-index:2147483647;width:320px;max-width:calc(100vw - 24px);';const shadow=panel.attachShadow({mode:'closed'});const style=element('style');style.textContent=':host{all:initial}*{box-sizing:border-box}.box{font:13px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#0a0a0a;background:#fff;border:1px solid #e4e4e7;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.14);padding:16px;position:relative;overflow:hidden}.box::before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:#ea8a0c}small{font-size:10px;color:#71717a;letter-spacing:.04em;text-transform:uppercase}h3{font-size:15px;font-weight:600;margin:8px 0 10px}p{font-size:11px;color:#71717a;margin:6px 0}button{font:500 12px system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;border:1px solid #18181b;border-radius:8px;background:#18181b;color:#fafafa;padding:7px 12px;margin:6px 6px 0 0}button:last-of-type{background:#fff;color:#0a0a0a;border-color:#e4e4e7}button:hover{opacity:.88}button:disabled{opacity:.5}input{font:14px system-ui,sans-serif;padding:7px 10px;border:1px solid #e4e4e7;border-radius:8px;max-width:100%;color:#0a0a0a;background:#fff}a{color:#0a0a0a}';shadow.append(style);const box=element('div');box.className='box';box.setAttribute('role','region');box.setAttribute('aria-label','TaskTime');const w=words[s.lang]||words.bg;box.append(element('small','◷ TaskTime · '+w.pending),element('h3',w[{plan:'plan','clock-out':'out',overtime:'over',reminder:'reminder'}[p.kind]]));box.append(element('small',new Date(p.at).toLocaleString(s.lang==='en'?'en-GB':'bg-BG')));
 const error=element('p');error.setAttribute('role','status');
 const answer=async value=>{for(const b of box.querySelectorAll('button'))b.disabled=true;try{const r=await chrome.runtime.sendMessage({kind:'answer',id:p.id,value});if(r?.error)throw Error(r.error);await sync()}catch(e){error.textContent=e.message;for(const b of box.querySelectorAll('button'))b.disabled=false}};
 const action=(label,value)=>{const b=element('button',label);b.addEventListener('click',()=>answer(value));box.append(b)};
 if(p.kind==='plan'){const input=element('input');input.type='time';input.setAttribute('aria-label',w.plan);const preview=element('p');input.addEventListener('input',()=>{if(!input.value)return;const d=new Date(p.at);const [h,m]=input.value.split(':').map(Number);d.setHours(h,m,0,0);if(+d<=p.at)d.setDate(d.getDate()+1);preview.textContent=w.next+' '+d.toLocaleString(s.lang==='en'?'en-GB':'bg-BG')});box.append(element('p',w.note),input,preview);const b=element('button',w.save);b.addEventListener('click',()=>{if(input.value)answer(input.value)});box.append(b)}
 else if(p.kind==='clock-out'){box.append(element('p',w.note));action(w.break,'break');action(w.finish,'finish')}
 else if(p.kind==='overtime'){action(w.overtime,'overtime');action(w.finish,'finish')}
 const report=element('button',w.report);report.addEventListener('click',()=>send({kind:'open'}));box.append(report,error);shadow.append(box);document.documentElement.append(panel);
}
async function sync(){const s=await send({kind:'get'});if(s)render(s)}
let postQaSent='';
// Post QA tasks have the same URL; the page shows a red "Post QA" label instead.
function scanPostQa(){if(postQaSent===location.href||!document.body)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(n.nodeValue.trim().toLowerCase()==='post qa'&&n.parentElement&&visible(n.parentElement)){postQaSent=location.href;send({kind:'post-qa'});return}}}
function observe(){if(stopped)return;if(isTasks){if(location.href!==lastURL){lastURL=location.href;lastObserve=0;errorSent=false}scanPostQa();if(Date.now()-lastObserve>=15000){lastObserve=Date.now();send({kind:'task-observe',url:location.href,visible:document.visibilityState==='visible'})}const err=[...document.querySelectorAll('[role="alert"],.alert-danger,.toast-error')].some(el=>visible(el)&&/error|failed|unable|грешка/i.test(el.textContent||''));if(err&&!errorSent){errorSent=true;send({kind:'task-error'})}}else scanClock()}
document.addEventListener('click',e=>{const b=e.target.closest?.('button,a,[role="button"],input');if(!b||!isTasks||!e.isTrusted)return;const text=(b.value||b.textContent||'').trim().replace(/\s+/g,' ');if(/^(Finish|Clear\s+Samples)\s*&\s*(Next|Exit)$/i.test(text))send({kind:'finish',finishKind:/Next/i.test(text)?'next':'exit'})},true);
let debounce;const observer=new MutationObserver(()=>{clearTimeout(debounce);debounce=setTimeout(observe,300)});observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','disabled','style']});
setInterval(()=>{observe();sync()},15000);setInterval(()=>{if(isTasks)observe();else scanClock()},1000);document.addEventListener('visibilitychange',()=>{observe();sync()});chrome.storage.onChanged.addListener((changes,area)=>{if(area==='local'&&changes.tasktime)sync()});observe();sync();
chrome.runtime.onMessage.addListener(m=>{if(m?.kind==='beep-page')tasktimeBeep(m.volume)});

/* Tab alert stages: green = new task while away; orange = "Are you still active?"; red = <=5 s left. */
if(isTasks){
 const COLORS={green:'#2fbf4a',orange:'#ff9a1f',red:'#e5262d'};let green=false,stage=null,lastBeep=0,savedTitle=null,savedIcons=null,blink=false;
 const focused=()=>document.visibilityState==='visible'&&document.hasFocus();
 function idleModal(){const body=document.body;if(!body||!/still active/i.test(body.textContent||''))return null;const w=document.createTreeWalker(body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(!/are you still active/i.test(n.nodeValue))continue;let el=n.parentElement;if(!el||!visible(el))continue;for(let i=0;i<6&&el.parentElement&&!/seconds?/i.test(el.textContent);i++)el=el.parentElement;const m=(el.textContent||'').match(/in\s+(\d+)\s+seconds?/i);return {sec:m?Number(m[1]):null}}return null}
 function iconURL(color){const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d');g.fillStyle=color;g.beginPath();g.arc(16,16,14,0,Math.PI*2);g.fill();g.lineWidth=3;g.strokeStyle='#fff';g.stroke();return c.toDataURL()}
 function setLook(color,title){if(savedTitle===null){savedTitle=document.title;savedIcons=[...document.querySelectorAll('link[rel~="icon"]')].map(l=>[l,l.href])}
  document.querySelectorAll('link[rel~="icon"]').forEach(l=>{if(!l.dataset.tasktime)l.remove()});let l=document.querySelector('link[data-tasktime]');if(!l){l=document.createElement('link');l.rel='icon';l.dataset.tasktime='1';document.head.append(l)}const u=iconURL(color);if(l.href!==u)l.href=u;if(document.title!==title)document.title=title}
 function restore(){if(savedTitle===null)return;document.querySelector('link[data-tasktime]')?.remove();for(const [l,href] of savedIcons){l.href=href;if(!l.isConnected)document.head.append(l)}document.title=savedTitle;savedTitle=null;savedIcons=null}
 function step(){if(stopped)return;if(green&&focused()){green=false;send({kind:'alert-clear'})}
  const modal=idleModal();const next=modal?(modal.sec!=null&&modal.sec<=5?'red':'orange'):green?'green':null;stage=next;blink=!blink;
  if(!next)return restore();
  if(next==='green')setLook(COLORS.green,blink?'🟢 New task':(savedTitle??document.title));
  else{const emoji=next==='red'?'🔴':'🟠';setLook(COLORS[next],`${emoji} Not Active ${modal.sec??''} sec.`.replace('  ',' '))
   const every=next==='red'?500:1000;if(Date.now()-lastBeep>=every-50){lastBeep=Date.now();send({kind:'alert-beep'})}}}
 chrome.runtime.onMessage.addListener(m=>{if(m?.kind==='stage-green'&&!focused()){green=true;step()}});
 setInterval(step,500);window.addEventListener('focus',step);
}

/* Post QA reminder: a coloured line under each neighbouring chunk button that has a task.
   Orange = not opened yet, green = opened. Only reminds — never blocks the page.
   The row looks like [962] [Jump to chunk for task: 963] [964]; a chunk without a task has light (greyed) text. */
if(isTasks){
 let url='',visited=new Set();
 const style=document.createElement('style');style.textContent='[data-tasktime-chunk]{box-shadow:inset 0 -4px 0 #ea8a0c!important;transition:box-shadow .2s}[data-tasktime-chunk="done"]{box-shadow:inset 0 -4px 0 #16a34a!important}';
 const lum=c=>{const m=String(c).match(/\d+(\.\d+)?/g);if(!m)return 0;const [r,g,b]=m.map(Number);return (0.2126*r+0.7152*g+0.0722*b)/255};
 const hasTask=el=>!el.disabled&&el.getAttribute('aria-disabled')!=='true'&&!/\bdisabled\b/i.test(el.className||'')&&parseFloat(getComputedStyle(el).opacity||'1')>=.7&&lum(getComputedStyle(el).color)<.5;
 function chunkRow(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){if(!/Jump to chunk for task:\s*\d+/i.test(n.nodeValue))continue;let jump=n.parentElement;while(jump&&jump.parentElement&&![...jump.parentElement.children].some(c=>c!==jump&&/^\s*\d+\s*$/.test(c.textContent)))jump=jump.parentElement;if(!jump?.parentElement)return null;
   return [...jump.parentElement.children].filter(c=>c!==jump&&/^\s*\d+\s*$/.test(c.textContent)&&visible(c))}return null}
 function isPostQa(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))if(n.nodeValue.trim().toLowerCase()==='post qa'&&n.parentElement&&visible(n.parentElement))return true;return false}
 const clear=()=>document.querySelectorAll('[data-tasktime-chunk]').forEach(e=>e.removeAttribute('data-tasktime-chunk'));
 document.addEventListener('click',e=>{const b=e.target.closest?.('button,a,[role="button"],div,span');const t=(b?.textContent||'').trim();if(/^\d+$/.test(t))visited.add(t)},true);
 setInterval(()=>{if(stopped)return;if(location.href!==url){url=location.href;visited=new Set();clear()}
  const row=tips.postQaChunks&&isPostQa()&&chunkRow();if(!row){clear();return}if(!style.isConnected)document.head.append(style);
  for(const c of row){const num=c.textContent.trim();if(!hasTask(c))c.removeAttribute('data-tasktime-chunk');else c.setAttribute('data-tasktime-chunk',visited.has(num)?'done':'todo')}},700);
}
})();
