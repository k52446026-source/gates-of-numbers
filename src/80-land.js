/* =====================================================================
   ЗЕМЛЯ: врата
   ===================================================================== */
window.showLand = n=>{
  const L=landOf(n);
  const keys=landKeys(n);
  const allOpen = keys.every(k=>{const f=S.facts[k]; return f&&f.reps>0;});
  const bossReady = allOpen && !S.bossDone[n];
  const finalReady = n===10 && allOpen && !S.chaosDone && LANDS.slice(0,8).every(l=>S.bossDone[l.n]);
  const bossBeaten = S.bossDone[n] || (n===10 && S.chaosDone);
  const blitzOk = bossBeaten && !(S.settings.calm || prof().calm); // спокойные профили — без таймеров (GDD §12)
  const gates = [1,...Array.from({length:9},(_,i)=>i+2)].map(m=>{
    const k=keyOf(n,m);
    if(m===1){
      return `<div class="gate open" tabindex="0" role="button" aria-label="Зеркальные врата ${n} на 1, открыты" style="--landGlow:${L.color}66" onclick="toast('🪞 Зеркальные врата: ${n}×1 = ${n}. Ты знал это с самого начала!')">
        <div class="glabel">${n}×1</div><div class="gsub">зеркало</div></div>`;
    }
    const f=S.facts[k];
    const opened=f&&f.reps>0;
    const twin = opened && (f.origin!=null ? f.origin!==n : Math.min(n,m)!==n); // открыто из другой земли
    const gl=ghostLevel(f);
    const cls = opened ? `open ${gl?`due${gl}`:""} ${twin?"twin":""}` : "locked";
    const sub = !opened ? "заперто" : gl>=3 ? "призрак…" : gl>0 ? "шепчет" : (twin?"близнец":"открыто");
    return `<div class="gate ${cls}" tabindex="0" role="button" aria-label="Врата ${n} на ${m}, ${sub}" style="--landGlow:${L.color}66" onclick="gateTap(${n},${m})">
      <div class="glabel">${n}×${m}</div><div class="gsub">${sub}</div></div>`;
  }).join("");
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← Карта</button>
      <span class="spacer"></span>
      ${keys.some(k=>{const f=S.facts[k]; return !f||f.reps===0;})?`<span class="chip">🆕 сегодня: ${Math.min(S.newToday,prof().newPerTrip)}/${prof().newPerTrip}</span>`:""}
      <span class="chip">✨ ${S.sparks}</span>
    </div>
    <h2 style="color:${L.color}; text-shadow:0 0 12px ${L.color}55;">${L.icon} ${esc(L.name)}</h2>
    <p class="muted" style="margin:6px 0 14px;">Таблица ×${n}. Врата-близнецы уже открыты с другой стороны — просто посмотри на них.</p>
    <div class="gates">${gates}</div>
    <div class="card boss-card" style="border-color:${L.color}66;">
      <div class="boss-head">
        <div class="boss-emoji" style="--landGlow:${L.color}aa;">${L.bossIcon}</div>
        <div class="grow">
          <h3>${esc(L.boss)}</h3>
          <div class="muted" style="font-size:13.5px;">${allOpen? (S.bossDone[n]||S.chaosDone&&n===10?"Побеждён! Земля свободна. 👑":"Стережёт выход из земли…") : "Появится, когда все врата открыты."}</div>
        </div>
        ${finalReady?`<button class="btn primary" onclick="startChaos()">⚔️ Финальный бой!</button>`
          : bossReady&&n!==10?`<button class="btn primary" onclick="startBoss(${n})">⚔️ В бой!</button>`
          : bossReady&&n===10?`<button class="btn" onclick="toast('Хаос ждёт, когда падут все восемь боссов…')">🌀</button>`
          : blitzOk?`<button class="btn" style="background:linear-gradient(135deg,#3b2f0e,#5b4a14); border:1px solid #ffd16655;" onclick="startBlitz(${n})">⚡ Бой-молния${S.blitzDone[n]?` · ${S.blitzDone[n]}`:""}</button>`:""}
      </div>
    </div>
    ${S.tricksShown[n]?`<div class="hintbox" style="margin-top:12px;">🧙‍♂️ ${esc(L.trick)}</div>`:""}
  `);
};
window.gateTap = (n,m)=>{
  const f=fact(n,m);
  if(f && f.reps>0 && !isDue(f)){
    toast(`✨ Врата сияют: <b>${n}×${m} = ${n*m}</b>`);
    return;
  }
  if((!f || f.reps===0) && S.newToday>=prof().newPerTrip){
    toast("🧙‍♂️ «На сегодня новых врат хватит — мозгу нужен сон, чтобы их запомнить. Повтори шепчущие или возвращайся завтра»", 3200);
    return;
  }
  startGateFlow(n,m);
};

/* Поток одного врат: фазы — GDD §5 */
function startGateFlow(n,m){
  const f=ensureFact(n,m);
  const L=landOf(n);
  if(f.reps===0){
    // Фаза 1: Знакомство — статичная сцена, тихо, 1 канал
    render(`
      <div class="topbar"><button class="btn small ghostb" onclick="showLand(${n})">← Назад</button></div>
      <div class="quiz-wrap center col" style="gap:16px;">
        <div class="phase-tag">Фаза 1 · Знакомство</div>
        <div class="scene">
          ${dotsScene(Math.min(n,m),Math.max(n,m))}
          <div class="equation" style="font-size:40px;">${n} × ${m} = <b style="color:var(--accent)">${n*m}</b></div>
          <p class="muted">${Math.min(n,m)} ряд${Math.min(n,m)>=5?"ов":Math.min(n,m)>1?"а":""} по ${Math.max(n,m)} — всего ${n*m}. Запомни картину.</p>
        </div>
        <button class="btn primary big" onclick="gatePhase2(${n},${m})">Теперь я сам!</button>
      </div>
    `);
  }else{
    // Повторение: фаза привязана к реально прошедшему времени (GDD §5)
    const phase = phaseFor(f);
    const st=magicStage();
    if(phase===2 && st<3) speak(`${MULT_ADV[n]||n} ${numWords(m)}?`);
    askFact({
      a:n, b:m, phase,
      onQuit:()=>showLand(n),
      headerHtml: phase===2 && st<3
        ? `<div class="lore center" style="margin-bottom:4px;">🎵 «${MULT_ADV[n]||n} ${numWords(m)} — …?» Проговори вслух и добей ритм числом!</div>`
        : st>=2 ? ""
        : `<div class="center" style="font-size:26px; padding:4px;">${L.icon}</div>`,
      onDone:(ok,ms,att)=>afterAnswer(n,m,ok,ms,att, ()=>{
        if(phase===2){ speak(mantra(n,m)); toast(`🎵 «${mantra(n,m)}»`, 2600); }
        showLand(n);
      }),
    });
  }
}
window.gatePhase2 = (n,m)=>{
  askFact({
    a:n,b:m, phase:1, noHint:false,
    onQuit:()=>showLand(n),
    onDone:(ok,ms,att)=>{
      const f=ensureFact(n,m);
      f.reps=1; f.origin=n; scheduleNext(f, ok);
      if(ok) recTime(f,ms);
      S.sparks+=10; S.newToday++; openFresco(1);
      S.stats.answers++; if(ok)S.stats.correct++;
      if(!ok){ f.errors++; bumpLandErrors(n); }
      save();
      fireworks(10);
      const [x,y]=[Math.min(n,m),Math.max(n,m)];
      toast(x!==y?`🚪 Открыты сразу двое врат: <b>${x}×${y}</b> и <b>${y}×${x}</b> — это одна дверь! +10 ✨`
                 :`🚪 Врата <b>${x}×${y}</b> открыты! +10 ✨`, 2800);
      maybeTrick(n, ()=>showLand(n));
    }
  });
};

/* Обработка ответа при повторении */
function afterAnswer(n,m,ok,ms,attempts, next){
  const f=ensureFact(n,m);
  const wasBox=f.box;
  const prevLast=f.last; // до scheduleNext, который перезапишет last
  f.reps++;
  if(ms>5000) f.slowCnt++;
  if(ok) recTime(f,ms); // автоматизация — время верного ответа с первой попытки
  if(!ok){ f.errors++; bumpLandErrors(n); }
  scheduleNext(f, ok);
  S.stats.answers++; if(ok)S.stats.correct++;
  // Асимметричная награда — GDD §6.3: осколок за повторение через 7+ реальных дней
  const longGap = prevLast && (Date.now()-prevLast) >= 7*DAY/srsMult();
  if(ok){
    if(longGap){
      const lore=grantShard();
      S.sparks+=5;
      toast(`🧩 Осколок лора: <i>«${esc(lore)}»</i> +5 ✨`, 3400);
    }else{
      S.sparks += wasBox<=1 ? 3 : 5;
      toast(`✔ Верно! +${wasBox<=1?3:5} ✨`);
    }
  }else{
    S.sparks+=1;
    toast("Ты добрался до ответа — это тоже победа. +1 ✨ за упорство");
  }
  save();
  maybeTrick(n, next);
}
function bumpLandErrors(n){
  S.landErrors[n]=(S.landErrors[n]||0)+1;
}
/* Just-in-time трюки — GDD §7.4 */
function maybeTrick(n, next){
  const L=landOf(n);
  const need = n===9?3:2;
  if(!S.tricksShown[n] && (S.landErrors[n]||0)>=need && n>=4){
    S.tricksShown[n]=true; save();
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:56px;">🧙‍♂️</div>
        <h2>Магистр Множитель шепчет приём</h2>
        <div class="hintbox" style="font-size:18px;">${esc(L.trick)}</div>
        <p class="muted">Этот приём теперь всегда в Мастерской.</p>
        <button class="btn primary big" id="trickNext">Понял! Дальше</button>
      </div>
    `);
    document.getElementById("trickNext").onclick = next;
  }else next();
}

