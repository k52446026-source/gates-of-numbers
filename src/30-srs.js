/* ---------------- Факты и SRS ---------------- */
function keyOf(a,b){ const [x,y]=a<=b?[a,b]:[b,a]; return x+"x"+y; }
function fact(a,b){ return S.facts[keyOf(a,b)] || null; }
function isOpen(a,b){ const f=fact(a,b); return !!(f && f.reps>0); }
function ensureFact(a,b){
  const k=keyOf(a,b);
  if(!S.facts[k]) S.facts[k]={reps:0, box:0, due:0, last:0, errors:0, streak:0, slowCnt:0};
  return S.facts[k];
}
function srsMult(){ return (S.settings.srsMult||1) * prof().srs; }
function scheduleNext(f, ok){
  const now=Date.now();
  if(ok){ f.box=Math.min(f.box+1, SRS_DAYS.length-1); f.streak++; }
  else  { f.box=Math.max(f.box-1, 1); f.streak=0; }
  f.last=now;
  f.due = now + SRS_DAYS[f.box]*DAY/srsMult();
}
/* уровень «призрачности»: 0 свежие, 1 мерцают, 2 полупрозрачные, 3 призрак */
function ghostLevel(f){
  if(!f || f.reps===0) return 0;
  const over = Date.now() - f.due;
  if(over<0) return 0;
  if(over < 2*DAY/srsMult()) return 1;
  if(over < 6*DAY/srsMult()) return 2;
  return 3;
}
function isDue(f){ return f && f.reps>0 && Date.now()>=f.due; }
/* фаза повторения по реально прошедшему времени (GDD §5): «SRS-дни» = дни × темп профиля */
function phaseFor(f){
  const srsDays=(Date.now()-f.last)/DAY*srsMult();
  return srsDays<2 ? 2 : srsDays<6 ? 3 : 4;
}
/* «липкие» примеры для Уголка Забвения — GDD §6.2 */
function stickyFacts(){
  return Object.entries(S.facts)
    .filter(([k,f]) => f.reps>0 && (f.errors>=2 || f.slowCnt>=2))
    .map(([k])=>k);
}
function parseKey(k){ const [a,b]=k.split("x").map(Number); return {a,b}; }
/* все ключи земли n: n×m, m=2..10 (×1 — зеркальные, открываются во вступлении) */
function landKeys(n){ const r=[]; for(let m=2;m<=10;m++) r.push(keyOf(n,m)); return [...new Set(r)]; }
function landOpenCount(n){ return landKeys(n).filter(k=>{const f=S.facts[k]; return f&&f.reps>0;}).length; }
function landDueCount(n){ return landKeys(n).filter(k=>isDue(S.facts[k])).length; }
function landUnlocked(n){
  if(n===2 || S.allLandsOpen) return true; // знаток гуляет по карте свободно
  const idx=LANDS.findIndex(l=>l.n===n);
  const prev=LANDS[idx-1].n;
  return landOpenCount(prev)===landKeys(prev).length; // все врата прошлой земли открыты
}
function totalOpen(){ // из 45 «настоящих» + 10 зеркальных = 55
  const real=Object.values(S.facts).filter(f=>f.reps>0).length;
  return real + (S.introDone?10:0);
}
function openFresco(k){
  for(let i=0;i<k;i++){
    const closed=[]; for(let c=0;c<100;c++) if(!S.frescoCells.includes(c)) closed.push(c);
    if(!closed.length) return;
    S.frescoCells.push(rnd(closed));
  }
}
function grantShard(){
  const idx=Math.floor(Math.random()*LORE.length);
  S.shards.push(idx);
  openFresco(2);
  save();
  return LORE[idx];
}
/* сглаженное время ответа — для метрики автоматизации (<2 сек) */
function recTime(f,ms){ if(ms>0 && ms<60000) f.ema = f.ema ? Math.round(f.ema*0.7+ms*0.3) : ms; }
function grantArtifact(){
  const left=ARTIFACTS.filter(a=>!S.artifacts.includes(a.id) && a.id!=="bolt" && a.id!=="trial");
  if(!left.length) return null;
  const a=rnd(left); S.artifacts.push(a.id); save(); return a;
}

/* ---------------- Подсказки-декомпозиции — GDD §7.2 ---------------- */
let hintFlip=false;
function hintFor(a,b){
  // t — «таблица» подсказки (больший множитель), k — второй
  const t=Math.max(a,b), k=Math.min(a,b);
  // чередуем два пути к ответу (Baroody, GDD §2): табличный трюк и «сосед снизу»
  hintFlip=!hintFlip;
  if(hintFlip && t>2 && t<10){
    return `Сосед снизу: ${k}×${t} = ${k}×${t-1} + ${k} = ${k*(t-1)} + ${k}. Сколько это?`;
  }
  switch(t){
    case 2: return `${k}×2 — это ${k} + ${k}. Сколько будет ${k} + ${k}?`;
    case 3: return `${k}×3 — это ${k}×2 + ${k} = ${k*2} + ${k}. Сколько это?`;
    case 4: return `${k}×4 — удвой дважды: ${k}×2 = ${k*2}, а ${k*2}×2 = ?`;
    case 5: return `${k}×5 — половина от ${k}×10. ${k}×10 = ${k*10}, а половина — ?`;
    case 6: return `${k}×6 — это ${k}×5 + ${k} = ${k*5} + ${k}. Сколько это?`;
    case 7: return `${k}×7 — это ${k}×5 + ${k}×2 = ${k*5} + ${k*2}. Сколько это?`;
    case 8: return `${k}×8 — это ${k}×10 − ${k}×2 = ${k*10} − ${k*2}. Сколько это?`;
    case 9: return `${k}×9 — это ${k}×10 − ${k} = ${k*10} − ${k}. Сколько это?`;
    case 10: return `${k}×10 — просто припиши ноль к ${k}!`;
  }
  return `Попробуй по шагам: ${a}×${b} = ${a}×${b-1} + ${a}.`;
}

