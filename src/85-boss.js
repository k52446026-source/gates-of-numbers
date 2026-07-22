/* =====================================================================
   БОСС ЗЕМЛИ — GDD §7
   ===================================================================== */
let boss=null;
window.startBoss = n=>{
  const L=landOf(n);
  let [total,need,allowed] = (prof().softBoss ? BOSS_SOFT : BOSS_CFG[n]);
  // трещины: слабые факты земли в приоритете
  const keys=shuffle(landKeys(n));
  keys.sort((a,b)=>((S.facts[b]?.errors||0)-(S.facts[a]?.errors||0)));
  const picked=[];
  while(picked.length<total) picked.push(...keys.slice(0, total-picked.length));
  boss={n, total, need, allowed, cracks:picked.slice(0,total).map(k=>({k, state:"open"})),
        idx:0, closed:0, failed:0, consecFail:0, flawless:true, bonus:false};
  bossIntro(L);
};
function bossIntro(L){
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div class="boss-emoji" style="font-size:80px; --landGlow:${L.color}aa;">${L.bossIcon}</div>
      <h1>${esc(L.boss)}</h1>
      <p class="muted" style="max-width:420px; margin:0 auto;">
        На теле босса — ${boss.total} трещин с примерами. Закрой <b style="color:var(--text)">${boss.need}</b>,
        чтобы победить. ${prof().hard
          ? "⚔️ Режим Мастера: <b style=\"color:var(--text)\">один выстрел на трещину, на время</b>, без подсказок и без пощады."
          : "Ошибка — не провал: босс сам подскажет путь."}
      </p>
      <button class="btn primary big" onclick="bossNext()">⚔️ Начать бой</button>
      <button class="btn ghostb small" onclick="showLand(${boss.n})">Отступить</button>
    </div>
  `);
}
function bossCracksHtml(){
  return `<div class="cracks">${boss.cracks.map((c,i)=>
    `<div class="crack ${c.state==="closed"?"closed":c.state==="failed"?"failed":""} ${i===boss.idx&&c.state==="open"?"current":""}">
      ${c.state==="closed"?"✔":c.state==="failed"?"✖":"⚡"}</div>`).join("")}</div>
    <div class="bossbar"><div style="width:${Math.min(100, boss.closed/boss.need*100)}%"></div></div>`;
}
window.bossNext = ()=>{
  if(!boss) return; // бой мог завершиться отступлением
  const L=landOf(boss.n);
  // конец?
  const remaining = boss.cracks.filter(c=>c.state==="open").length;
  if(remaining===0 || boss.failed>boss.allowed){
    return bossEnd();
  }
  // адаптив: 2 подряд ошибки — босс «устал», убираем трещину — GDD §7.3 (в режиме Мастера пощады нет)
  if(!prof().hard && boss.consecFail>=2 && remaining>1){
    const c=boss.cracks.filter(c=>c.state==="open").pop();
    c.state="closed"; boss.closed++; boss.consecFail=0;
    toast(`😮‍💨 ${esc(L.boss)} устал и опустил щит — одна трещина закрылась сама!`, 3000);
    save();
    return setTimeout(bossNext, 900);
  }
  while(boss.cracks[boss.idx].state!=="open") boss.idx=(boss.idx+1)%boss.cracks.length;
  const {a,b}=parseKey(boss.cracks[boss.idx].k);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  const hard=prof().hard;
  askFact({
    a:x,b:y, phase:null,
    oneShot:hard, timer:hard?5:undefined, noHint:hard, // Мастер: один выстрел на трещину, на время, без подсказки
    onQuit:()=>{ const bn=boss.n; boss=null; toast("Отступление — тоже разведка. Босс будет ждать."); showLand(bn); },
    progress:`Закрыто ${Math.min(boss.closed, boss.need)}/${boss.need}`,
    headerHtml:`<div class="center"><div class="boss-emoji" style="--landGlow:${L.color}aa;">${L.bossIcon}</div>${bossCracksHtml()}</div>`,
    hint:`«Почти!» — рычит ${esc(L.boss)}. ${hintFor(x,y)}`,
    onDone:(ok,ms)=>{
      const c=boss.cracks[boss.idx];
      const f=ensureFact(x,y); S.stats.answers++; if(ok) recTime(f,ms);
      if(ok){
        c.state="closed"; boss.closed++; boss.consecFail=0; S.sparks+=5; S.stats.correct++;
        f.streak++;
      }else{
        // ответ со 2+ попытки: трещина остаётся, засчитана ошибка
        c.state="failed"; boss.failed++; boss.consecFail++; boss.flawless=false;
        f.errors++; bumpLandErrors(boss.n); S.sparks+=1;
      }
      save();
      // ярость: без ошибок и всё закрыто — бонус-трещина из другой земли — GDD §7.3
      if(boss.flawless && boss.closed===boss.total && !boss.bonus){
        boss.bonus=true;
        const others=LANDS.filter(l=>l.n!==boss.n && landOpenCount(l.n)>0);
        if(others.length){
          const ol=rnd(others);
          const ok2=rnd(landKeys(ol.n).filter(k=>S.facts[k]&&S.facts[k].reps>0));
          if(ok2){
            boss.cracks.push({k:ok2, state:"open"});
            boss.total++;
            toast(`😡 ${esc(L.boss)} в ярости призвал подмогу из земли «${esc(ol.name)}»!`, 3000);
          }
        }
      }
      setTimeout(bossNext, 500);
    }
  });
};
function bossEnd(){
  const L=landOf(boss.n);
  const win = boss.closed>=boss.need && boss.failed<=boss.allowed;
  if(win){
    S.bossDone[boss.n]=true;
    S.sparks+=50; openFresco(3);
    let extra="";
    if(boss.flawless){
      const a=grantArtifact();
      if(a) extra=`<p>🏆 Без единой ошибки! Редкий артефакт: <b>${a.icon} ${esc(a.name)}</b><br><span class="muted">Титул: «${esc(a.title)}»</span></p>`;
    }
    save(); sndWin(); fireworks(24, true);
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:70px;">👑</div>
        <h1>${esc(L.boss)} побеждён!</h1>
        <p class="muted">Земля «${esc(L.name)}» свободна. +50 ✨</p>
        ${extra}
        <button class="btn primary big" onclick="showMap()">На карту</button>
      </div>`);
  }else{
    sndBad();
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div class="boss-emoji" style="font-size:70px;">${L.bossIcon}</div>
        <h2>${esc(L.boss)} отступил за трещины…</h2>
        <p class="muted">Ты закрыл ${boss.closed} из ${boss.need}. Это не поражение — это разведка.
        Загляни в Мастерскую за приёмом и возвращайся!</p>
        <button class="btn primary" onclick="startBoss(${boss.n})">⚔️ Ещё раз</button>
        <button class="btn ghostb" onclick="showLand(${boss.n})">Передохнуть</button>
      </div>`);
  }
  boss=null;
}

/* =====================================================================
   БОЙ-МОЛНИЯ: реванш на скорость (автоматизация <2–3 сек, GDD §18)
   ===================================================================== */
let blitz=null;
window.startBlitz = n=>{
  const L=landOf(n);
  blitz={n, qs:shuffle(landKeys(n)).slice(0,7), i:0, bolts:0, marks:[], times:[]};
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div class="boss-emoji" style="font-size:70px; --landGlow:${L.color}aa;">${L.bossIcon}⚡</div>
      <h2>Бой-молния: ${esc(L.boss)}</h2>
      <p class="muted" style="max-width:430px; margin:0 auto;">Побеждённый босс вернулся потренировать тебя.
      7 ударов: ответь верно <b style="color:var(--accent)">быстрее 3 секунд</b> — получишь молнию.
      Собери <b style="color:var(--text)">5 молний</b> — и победа. Медленный ответ — не провал, просто без молнии.</p>
      ${S.blitzDone[n]?`<p class="muted">Твой рекорд: ⚡ ${S.blitzDone[n]} из 7</p>`:""}
      <button class="btn primary big" onclick="blitzNext()">⚡ Начать</button>
      <button class="btn ghostb small" onclick="showLand(${n})">Не сегодня</button>
    </div>`);
};
window.blitzNext = ()=>{
  if(!blitz) return;
  const L=landOf(blitz.n);
  if(blitz.i>=blitz.qs.length){ return blitzEnd(); }
  const {a,b}=parseKey(blitz.qs[blitz.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  const marks=blitz.marks.join("")+"▫".repeat(blitz.qs.length-blitz.i);
  askFact({
    a:x,b:y, noHint:true,
    onQuit:()=>{ const bn=blitz.n; blitz=null; showLand(bn); },
    progress:`⚡ ${blitz.bolts}`,
    headerHtml:`<div class="center">
      <div class="boss-emoji" style="--landGlow:${L.color}aa;">${L.bossIcon}</div>
      <div style="font-size:18px; letter-spacing:3px;">${marks}</div>
      <div class="blitz-bar"><div></div></div>
    </div>`,
    onDone:(ok,ms)=>{
      const hit = ok && ms<=3000;
      if(hit) blitz.bolts++;
      blitz.marks.push(hit?"⚡":"·");
      blitz.times.push(ms);
      if(ok) recTime(ensureFact(x,y), ms); // питает метрику автоматизации; SRS не трогаем — это тренировка
      S.stats.answers++; if(ok)S.stats.correct++;
      save();
      blitz.i++; blitzNext();
    }
  });
};
function blitzEnd(){
  const L=landOf(blitz.n);
  const win=blitz.bolts>=5;
  const avg=blitz.times.reduce((s,t)=>s+t,0)/blitz.times.length/1000;
  const first=win && !S.blitzDone[blitz.n];
  let extra="";
  if(win){
    S.blitzDone[blitz.n]=Math.max(S.blitzDone[blitz.n]||0, blitz.bolts);
    S.sparks += first?30:10;
    if(LANDS.every(l=>S.blitzDone[l.n]) && !S.artifacts.includes("bolt")){
      S.artifacts.push("bolt");
      const bolt=ARTIFACTS.find(a=>a.id==="bolt");
      extra=`<p>🏆 Все девять боссов повержены молнией! Артефакт: <b>${bolt.icon} ${esc(bolt.name)}</b><br><span class="muted">Титул: «${esc(bolt.title)}»</span></p>`;
    }
    save(); sndWin(); fireworks(18, true);
  }else{ save(); }
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:64px;">${win?"⚡👑":"⚡"}</div>
      <h2>${win?"Молниеносная победа!":"Хорошая тренировка!"}</h2>
      <div style="font-size:22px; letter-spacing:3px;">${blitz.marks.join("")}</div>
      <p class="muted">Молний: ${blitz.bolts} из 7 · среднее время: ${avg.toFixed(1)} сек</p>
      ${win?`<p class="muted">+${first?30:10} ✨${first?" (первая молниеносная победа!)":""}</p>`:`<p class="muted">Нужно 5 молний. Скорость приходит с повторением — загляни ещё раз!</p>`}
      ${extra}
      <button class="btn primary" onclick="startBlitz(${blitz.n})">⚡ Ещё раз</button>
      <button class="btn ghostb" onclick="showLand(${blitz.n})">К земле</button>
    </div>`);
  blitz=null;
}

