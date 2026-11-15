/* Short two-tone "look here" chime, generated with Web Audio (no audio files). */
function tasktimeBeep(volume){const v=Math.max(0,Math.min(1,Number(volume)||0));if(!v)return;const ctx=new AudioContext();const t=ctx.currentTime;
 for(const [freq,at] of [[880,0],[1320,0.18]]){const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0.0001,t+at);g.gain.exponentialRampToValueAtTime(0.4*v,t+at+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+at+0.16);o.connect(g).connect(ctx.destination);o.start(t+at);o.stop(t+at+0.17)}
 setTimeout(()=>ctx.close(),600)}
