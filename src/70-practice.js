/* =====================================================================
   ОЧЕРЕДЬ ПОВТОРЕНИЙ: все шепчущие врата одной миссией (GDD §15)
   ===================================================================== */
let review=null;
window.startReview = ()=>{
  const due=Object.entries(S.facts).filter(([k,f])=>isDue(f))
    .sort((a,b)=>a[1].due-b[1].due).map(([k])=>k).slice(0,8); // самые просроченные — первыми
  if(!due.length){ toast("✨ Призраков нет — все врата сияют!"); return; }
  review={qs:due, i:0};
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:60px;">👻⚡</div>
      <h2>Отрази агента Хаоса</h2>
      <p class="muted" style="max-width:420px; margin:0 auto;">${due.length} врат шепчут из тумана.
      Подзаряди их ответами — и агент отступит. Самые старые призраки дают осколки лора.</p>
      <button class="btn primary big" onclick="reviewNext()">⚡ Начать</button>
      <button class="btn ghostb small" onclick="showMap()">Позже</button>
    </div>`);
};
window.reviewNext = ()=>{
  if(!review) return;
  if(review.i>=review.qs.length){
    S.sparks+=10; save(); sndWin(); fireworks(16);
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:60px;">🛡️✨</div>
        <h2>Агент Хаоса отступил!</h2>
        <p class="muted">Врата снова сияют. +10 ✨ за дозор.</p>
        <button class="btn primary" onclick="showMap()">На карту</button>
      </div>`);
    review=null; return;
  }
  const k=review.qs[review.i];
  const {a,b}=parseKey(k);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  const phase=phaseFor(S.facts[k]);
  const st=magicStage();
  if(phase===2 && st<3) speak(`${MULT_ADV[x]||x} ${numWords(y)}?`);
  askFact({
    a:x,b:y, phase,
    onQuit:()=>{ review=null; showMap(); },
    progress:`${review.i+1} / ${review.qs.length}`,
    headerHtml: phase===2 && st<3
      ? `<div class="lore center" style="margin-bottom:4px;">🎵 «${MULT_ADV[x]||x} ${numWords(y)} — …?» Проговори вслух!</div>`
      : st>=2 ? ""
      : `<div class="center" style="font-size:26px; padding:4px;">👻</div>`,
    // земля трудности — больший множитель, а не случайная ориентация показа (иначе трюки уходят не туда)
    onDone:(ok,ms,att)=>afterAnswer(Math.max(x,y),Math.min(x,y),ok,ms,att, ()=>{ if(review){ review.i++; reviewNext(); } }),
  });
};

/* =====================================================================
   МАРАФОН: решить все примеры сразу, без ожидания призраков и порядка.
   Обновляет память (SRS/статистику), верный ответ открывает врата.
   ===================================================================== */
let marathon=null;
function allFactKeys(){
  const set=new Set();
  for(let n=2;n<=10;n++) for(let m=2;m<=10;m++) set.add(keyOf(n,m));
  return [...set]; // 45 уникальных фактов
}
window.startMarathon = ()=>{
  const chips=[];
  for(let n=2;n<=10;n++) chips.push(`<button class="btn ghostb" style="min-width:60px;" onclick="marathonRun(${n})">×${n}</button>`);
  render(`
    <div class="quiz-wrap center col" style="gap:16px; justify-content:center;">
      <div style="font-size:52px;">🏃</div>
      <h2>Марафон</h2>
      <p class="muted" style="max-width:440px; margin:0 auto;">Реши примеры прямо сейчас — без ожидания, без сюжета и таймеров.
      Верные ответы открывают врата и укрепляют память. Ошибся — Магистр подскажет.</p>
      <button class="btn primary big" onclick="marathonRun(0)">Вся таблица · 45 примеров</button>
      <p class="muted" style="font-size:13px;">или одна таблица:</p>
      <div class="row" style="flex-wrap:wrap; gap:8px; justify-content:center; max-width:380px;">${chips.join("")}</div>
      <button class="btn ghostb small" onclick="showMap()">На карту</button>
    </div>
  `);
};
window.marathonRun = table=>{
  const keys = table? Array.from({length:9},(_,i)=>keyOf(table,i+2)) : allFactKeys();
  marathon={qs:shuffle([...new Set(keys)]), i:0, ok:0, times:[], missed:[], table};
  marathonNext();
};
window.marathonNext = ()=>{
  if(!marathon) return;
  if(marathon.i>=marathon.qs.length){
    const {ok, qs, times, missed, table}=marathon;
    const avg=times.length?times.reduce((s,t)=>s+t,0)/times.length/1000:0;
    S.sparks += ok*2; save();
    if(ok===qs.length && ok>0) fireworks(20, true);
    marathon=null;
    render(`
      <div class="quiz-wrap center col" style="gap:14px;">
        <div style="font-size:56px;">${ok===qs.length?"🏆":"🏁"}</div>
        <h2>Марафон пройден!</h2>
        <p class="muted">Верно с первой попытки: <b style="color:var(--text)">${ok} из ${qs.length}</b> · среднее время: ${avg.toFixed(1)} сек · +${ok*2} ✨</p>
        ${missed.length?`<p class="muted">Стоит повторить: ${[...new Set(missed)].map(k=>{const{a,b}=parseKey(k);return `<b>${a}×${b}</b>`;}).join(", ")}</p>`:`<p class="lore">Ни одной ошибки — ты держишь всю таблицу!</p>`}
        <div class="row" style="justify-content:center; gap:10px; flex-wrap:wrap;">
          <button class="btn primary" onclick="marathonRun(${table})">Ещё раз</button>
          ${missed.length?`<button class="btn" onclick="marathonMissed(${JSON.stringify([...new Set(missed)]).replace(/"/g,"&quot;")})">Только трудные (${[...new Set(missed)].length})</button>`:""}
          <button class="btn ghostb" onclick="showMap()">На карту</button>
        </div>
      </div>
    `);
    return;
  }
  const {a,b}=parseKey(marathon.qs[marathon.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y,
    onQuit:()=>{ marathon=null; showMap(); },
    progress:`${marathon.i+1} / ${marathon.qs.length}`,
    headerHtml:`<div class="center" style="font-size:24px;">🏃</div>`,
    onDone:(ok,ms,att)=>{
      const k=keyOf(x,y);
      const f=ensureFact(x,y);
      const first=(f.reps===0);
      f.reps++;
      if(first) f.origin=Math.min(x,y);
      if(ok&&att===1){ marathon.ok++; recTime(f,ms); }
      else { f.errors++; marathon.missed.push(k); }
      if(ms>5000) f.slowCnt++;
      scheduleNext(f, ok&&att===1);
      marathon.times.push(ms);
      S.stats.answers++; if(ok&&att===1) S.stats.correct++;
      save();
      marathon.i++; marathonNext();
    }
  });
};
window.marathonMissed = keys=>{
  marathon={qs:shuffle(keys), i:0, ok:0, times:[], missed:[], table:0};
  marathonNext();
};

/* =====================================================================
   ИСПЫТАНИЕ МАСТЕРА: жёсткий челлендж 10+ — один выстрел, на время,
   3 жизни, реальный провал. Ответ не показывается до конца (отложенная
   обратная связь). Desirable difficulty + testing effect (GDD §2).
   ===================================================================== */
let trial=null;
const TRIAL_SEC=4, TRIAL_LEN=20, TRIAL_LIVES=3;
window.startTrial = ()=>{
  const opened=Object.entries(S.facts).filter(([k,f])=>f.reps>0).map(([k])=>k);
  if(opened.length<10){ // испытание — только по уже открытым фактам, иначе это не вызов, а расстрел
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:52px;">🗡️</div>
        <h2>Ещё рано для Испытания</h2>
        <p class="muted" style="max-width:440px; margin:0 auto;">Испытание проверяет то, что ты уже знаешь, а открыто пока
        только <b style="color:var(--text)">${opened.length}</b> врат. Пройди приключение или Марафон — и возвращайся за рангом Мастера.</p>
        <button class="btn primary" onclick="showMap()">На карту</button>
      </div>`);
    return;
  }
  trial={qs:shuffle(opened).slice(0,TRIAL_LEN), i:0, lives:TRIAL_LIVES, ok:0, times:[], missed:[]};
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:56px;">🗡️</div>
      <h2>Испытание Мастера</h2>
      <p class="muted" style="max-width:450px; margin:0 auto;">${trial.qs.length} примеров вперемешку. <b style="color:var(--text)">Один ответ на каждый</b>,
      на время (${TRIAL_SEC} сек). Подсказок нет, ответ не покажут. Ошибка или промедление — минус жизнь.
      Потеряешь <b style="color:var(--text)">все 3&nbsp;❤️</b> — испытание провалено.</p>
      <p class="muted">Разбор ошибок — в конце. За прохождение — ранг Мастера.</p>
      <button class="btn primary big" onclick="trialNext()">🗡️ Начать испытание</button>
      <button class="btn ghostb small" onclick="showMap()">Не сейчас</button>
    </div>
  `);
};
function trialHearts(){ return "❤️".repeat(trial.lives)+"🖤".repeat(TRIAL_LIVES-trial.lives); }
window.trialNext = ()=>{
  if(!trial) return;
  if(trial.lives<=0) return trialEnd(false);
  if(trial.i>=trial.qs.length) return trialEnd(true);
  const {a,b}=parseKey(trial.qs[trial.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y, oneShot:true, timer:TRIAL_SEC, noHint:true,
    onQuit:()=>{ trial=null; showMap(); },
    progress:`${trial.i+1} / ${trial.qs.length}`,
    headerHtml:`<div class="center" style="font-size:22px; letter-spacing:2px;">${trialHearts()}</div>`,
    onDone:(ok,ms,att,timedOut)=>{
      const f=ensureFact(x,y);
      if(ok){
        trial.ok++; f.reps++; recTime(f,ms); scheduleNext(f,true);
      }else{
        trial.lives--; trial.missed.push(keyOf(x,y));
        // честно неверный ответ — знаниевая ошибка, кормит SRS/Уголок; таймаут — только скорость, не незнание
        if(!timedOut){ f.reps++; f.errors++; scheduleNext(f,false); }
      }
      S.stats.answers++; if(ok) S.stats.correct++;
      save();
      if(!ok) toast(timedOut?"⏳ Время вышло! −1 ❤️":"✗ Мимо! −1 ❤️", 1200);
      trial.i++; trialNext();
    }
  });
};
function trialEnd(passed){
  const {ok, qs, times, missed, lives}=trial;
  const avg=times.length?times.reduce((s,t)=>s+t,0)/times.length/1000:0;
  let rank=0, rankName="", emblem="";
  if(passed){
    rank = (missed.length===0 && avg<2.5) ? 3 : missed.length<=2 ? 2 : 1;
    [rankName,emblem]=[["Бронза","🥉"],["Серебро","🥈"],["Золото","🥇"]][rank-1];
    S.sparks += [15,25,40][rank-1];
    S.trialBest=Math.max(S.trialBest||0, rank);
  }
  let extra="";
  if(rank===3 && !S.artifacts.includes("trial")){
    S.artifacts.push("trial");
    const a=ARTIFACTS.find(x=>x.id==="trial");
    extra=`<p>🏆 Золото с первого раза! Артефакт: <b>${a.icon} ${esc(a.name)}</b><br><span class="muted">Титул: «${esc(a.title)}»</span></p>`;
  }
  save();
  if(passed){ sndWin(); fireworks(20, true); } else sndBad();
  const review = missed.length
    ? `<div class="card" style="max-width:420px; margin:0 auto;"><b>Разбор — повтори это:</b><div class="row" style="flex-wrap:wrap; gap:8px; justify-content:center; margin-top:8px;">
        ${[...new Set(missed)].map(k=>{const{a,b}=parseKey(k);return `<span class="chip">${a}×${b} = <b>${a*b}</b></span>`;}).join("")}</div></div>`
    : "";
  render(`
    <div class="quiz-wrap center col" style="gap:14px;">
      <div style="font-size:60px;">${passed?emblem:"🗡️💔"}</div>
      <h2>${passed?`Ранг: ${rankName}!`:"Испытание не пройдено"}</h2>
      <p class="muted">Верно: ${ok} из ${qs.length} · осталось ${trialHearts0(lives)} · среднее время: ${avg.toFixed(1)} сек${passed?` · +${[15,25,40][rank-1]} ✨`:""}</p>
      ${passed?"":`<p class="muted">Кончились жизни. Это честный проигрыш — в этом и вызов. Разбери ошибки и вернись сильнее.</p>`}
      ${extra}
      ${review}
      <div class="row" style="justify-content:center; gap:10px; flex-wrap:wrap;">
        <button class="btn primary" onclick="startTrial()">🗡️ Ещё раз</button>
        <button class="btn ghostb" onclick="showMap()">На карту</button>
      </div>
    </div>
  `);
  trial=null;
}
function trialHearts0(l){ return "❤️".repeat(Math.max(0,l))+"🖤".repeat(TRIAL_LIVES-Math.max(0,l)); }

