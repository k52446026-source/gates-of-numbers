/* =====================================================================
   ПОРТАЛ ХАОСА (interleaving) — GDD §11
   ===================================================================== */
let portal=null;
window.startPortal = ()=>{
  const len=prof().portalLen||3;
  // примеры из РАЗНЫХ открытых таблиц
  const openKeys=Object.entries(S.facts).filter(([k,f])=>f.reps>0).map(([k])=>k);
  const byTable={};
  openKeys.forEach(k=>{const {a,b}=parseKey(k); byTable[b]=byTable[b]||[]; byTable[b].push(k); byTable[a]=byTable[a]||[]; byTable[a].push(k);});
  const tables=shuffle(Object.keys(byTable)).slice(0,len);
  const qs=[...new Set(tables.map(t=>rnd(byTable[t])))];
  while(qs.length<Math.min(len,openKeys.length)){ const k=rnd(openKeys); if(!qs.includes(k)) qs.push(k); }
  portal={qs:shuffle(qs), i:0, allOk:true};
  S.portalsThisSession++; save();
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:64px;">🌀</div>
      <h2>Портал Хаоса!</h2>
      <p class="muted" style="max-width:420px; margin:0 auto;">Тут смешалось всё: разные земли, разные таблицы.
      Реши ${portal.qs.length} примеров подряд — получишь <b style="color:var(--spark)">двойные искры</b> и осколок лора.</p>
      <button class="btn portal-btn" onclick="portalNext()">Шагнуть в воронку</button>
      <button class="btn ghostb small" onclick="showMap()">Пройти мимо</button>
    </div>
  `);
};
window.portalNext = ()=>{
  if(portal.i>=portal.qs.length){
    let msg;
    if(portal.allOk){
      S.sparks+=20;
      const lore=grantShard();
      msg=`Портал закрыт! +20 ✨ (двойные) и осколок:<br><i>«${esc(lore)}»</i>`;
      sndWin(); fireworks();
    }else{
      S.sparks+=8;
      msg="Портал закрыт. Было непросто — +8 ✨ за смелость!";
    }
    save(); portal=null;
    render(`<div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:60px;">🌀✔</div><h2>Готово!</h2>
      <p class="muted" style="max-width:400px;margin:0 auto;">${msg}</p>
      <button class="btn primary" onclick="showMap()">На карту</button></div>`);
    return;
  }
  const {a,b}=parseKey(portal.qs[portal.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y,
    onQuit:()=>{ portal=null; toast("Ты вышел из воронки — награда осталась внутри."); showMap(); },
    progress:`${portal.i+1} / ${portal.qs.length}`,
    headerHtml:`<div class="center" style="font-size:30px;">🌀</div>`,
    onDone:(ok,ms)=>{
      const f=ensureFact(x,y); f.reps++; if(ok) recTime(f,ms);
      if(!ok){ f.errors++; portal.allOk=false; }
      if(ms>5000) f.slowCnt++;
      scheduleNext(f, ok);
      S.stats.answers++; if(ok)S.stats.correct++;
      save();
      portal.i++; portalNext();
    }
  });
};

/* =====================================================================
   УГОЛОК ЗАБВЕНИЯ — GDD §6.2
   ===================================================================== */
let corner=null;
window.showCorner = ()=>{
  const sticky=stickyFacts().slice(0,8);
  if(!sticky.length){ toast("Подземелье пусто — Хаосу нечего прятать!"); return; }
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:60px;">🕯️</div>
      <h2>Уголок Забвения</h2>
      <p class="muted" style="max-width:430px; margin:0 auto;">Хаос спрятал под замком самые липкие примеры — те, что убегали от тебя.
      Спустись и забери их обратно. Там редкий лут.</p>
      <div class="row" style="justify-content:center; flex-wrap:wrap; gap:8px;">
        ${sticky.map(k=>{const{a,b}=parseKey(k); return `<span class="chip">👻 ${a}×${b}</span>`;}).join("")}
      </div>
      <button class="btn primary big" onclick="cornerGo()">Спуститься</button>
      <button class="btn ghostb small" onclick="showMap()">Не сегодня</button>
    </div>
  `);
  corner={qs:shuffle(sticky), i:0, tries:0};
};
window.cornerGo = ()=>{
  if(corner.i>=corner.qs.length){
    const a=grantArtifact();
    const lore=grantShard();
    S.sparks+=15; save(); sndWin(); fireworks(20);
    render(`<div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:60px;">🗝️✨</div>
      <h2>Ты забрал примеры у Хаоса!</h2>
      <p class="lore">«Ты не сдался. Это важнее, чем правильный ответ» — Магистр.</p>
      <p class="muted">+15 ✨ · осколок лора${a?` · артефакт <b>${a.icon} ${esc(a.name)}</b>`:""}</p>
      <button class="btn primary" onclick="showMap()">Наверх, к свету</button></div>`);
    corner=null; return;
  }
  const {a,b}=parseKey(corner.qs[corner.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y,
    onQuit:()=>{ corner=null; toast("Подземелье подождёт. Возвращайся смелее!"); showMap(); },
    progress:`${corner.i+1} / ${corner.qs.length}`,
    headerHtml:`<div class="center" style="font-size:28px;">🕯️</div>`,
    onDone:(ok,ms,att)=>{
      const f=ensureFact(x,y);
      f.reps++; if(ok) recTime(f,ms);
      if(ok && att===1){ f.errors=Math.max(0,f.errors-1); f.slowCnt=Math.max(0,f.slowCnt-1); }
      scheduleNext(f, ok);
      S.stats.answers++; if(ok)S.stats.correct++;
      save();
      corner.i++; cornerGo();
    }
  });
};

/* =====================================================================
   РЕЖИМ «БЕЗ МАГИИ» — GDD §9 (и финальный тест на Диплом)
   ===================================================================== */
let nomagic=null;
window.startNoMagic = (count, isFinal)=>{
  const openKeys=Object.entries(S.facts).filter(([k,f])=>f.reps>0).map(([k])=>k);
  if(openKeys.length<count){ toast("Пока мало открытых врат для контрольной."); return; }
  nomagic={qs:shuffle(openKeys).slice(0,count), i:0, ok:0, isFinal:!!isFinal, start:Date.now()};
  document.body.classList.add("paper");
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <h2 style="color:#222;">📝 ${isFinal?"Финальный тест Магистра":"Как на контрольной"}</h2>
      <p style="color:#666; max-width:420px; margin:0 auto;">${count} примеров. Белый лист. Без гномов, без молота, без подсказок.
      ${isFinal?"Реши 18 из 20 — и получишь Диплом Магистра.":"Просто ты и числа."}</p>
      <button class="btn" style="background:#198754; color:#fff;" onclick="noMagicNext()">Начать</button>
      <button class="btn ghostb small" onclick="document.body.classList.remove('paper'); showMap()">Назад</button>
    </div>
  `);
};
window.noMagicNext = ()=>{
  if(nomagic.i>=nomagic.qs.length){
    const {ok, qs, isFinal}=nomagic;
    const total=qs.length;
    S.noMagicResults.push({ts:Date.now(), correct:ok, total});
    let extra="";
    if(isFinal && ok/total>=0.9){
      S.diploma=true;
      extra=`<p style="color:#b8860b; font-weight:700;">🏅 ДИПЛОМ МАГИСТРА ТВОЙ! Смотри в Зале Славы.</p>`;
      sndWin();
    }
    save();
    render(`
      <div class="quiz-wrap center col" style="gap:14px;">
        <h2 style="color:#222;">Решил ${ok} из ${total}</h2>
        <p style="color:#555;">${ok===total?"Идеально. Ты готов к любой контрольной.":ok/total>=0.8?"Ты готов к контрольной. Пару примеров — в Уголок Забвения.":"Хаос ещё цепляется. Загляни в Уголок Забвения — и вернись."}</p>
        ${extra}
        <button class="btn" style="background:#198754;color:#fff;" onclick="document.body.classList.remove('paper'); showMap()">Вернуться в мир</button>
      </div>`);
    nomagic=null; return;
  }
  const {a,b}=parseKey(nomagic.qs[nomagic.i]);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y, paper:true, noHint:true,
    onQuit:()=>{ nomagic=null; showMap(); },
    progress:`${nomagic.i+1} / ${nomagic.qs.length}`,
    onDone:(ok,ms,att)=>{
      const f=ensureFact(x,y);
      if(ok) recTime(f,ms);
      if(ok&&att===1) nomagic.ok++;
      else { f.errors++; }
      if(ms>5000) f.slowCnt++;
      f.reps++; scheduleNext(f, ok&&att===1);
      S.stats.answers++; if(ok&&att===1)S.stats.correct++;
      save();
      nomagic.i++; noMagicNext();
    }
  });
};

/* =====================================================================
   ФИНАЛЬНЫЙ БОСС: ХАОС ЗАБВЕНИЯ — GDD §8
   ===================================================================== */
let chaos=null;
window.startChaos = ()=>{
  const calm = S.settings.calm || prof().calm;
  const openKeys=Object.entries(S.facts).filter(([k,f])=>f.reps>0).map(([k])=>k);
  chaos={calm, tiles:[], fixed:0, broken:0, waves:calm?1:3, wave:0, timer:null, over:false,
         pool:shuffle(openKeys)};
  for(let i=0;i<30;i++) chaos.tiles.push({k:chaos.pool[i%chaos.pool.length], state:"whole"});
  render(`
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:74px;">🌀</div>
      <h1>ХАОС ЗАБВЕНИЯ</h1>
      <p class="muted" style="max-width:440px; margin:0 auto;">
        Хаос ломает Врата мира ${calm?"— но время на твоей стороне: чини спокойно, в любом порядке."
        :"волнами. Чини в своём темпе — проигрыша нет, есть только трещины, которые можно долечить потом."}
      </p>
      <p class="muted">${calm?"Почини 15 из 20 — и Хаос падёт.":"Почини 25 из 30 — и Хаос падёт."}</p>
      <button class="btn primary big" onclick="chaosBegin()">⚔️ Последняя битва</button>
      <button class="btn ghostb small" onclick="showLand(10)">Отступить</button>
    </div>
  `);
};
window.chaosBegin = ()=>{
  if(chaos.calm){ breakTiles(20); }
  else{
    breakTiles(10);
    chaos.timer=setInterval(()=>{
      chaos.wave++;
      if(chaos.wave>=3){
        clearInterval(chaos.timer); chaos.timer=null;
        if(!quizState) drawChaos(); // переоценить условие победы после последней волны
        return;
      }
      breakTiles(10);
      chaos.newWave=true;
      // пока ребёнок вводит ответ — его экран неприкосновенен (GDD §5);
      // волна проявится, когда он вернётся к сетке
      if(!quizState) drawChaos();
    }, 20000);
  }
  drawChaos();
};
function breakTiles(k){
  const whole=chaos.tiles.filter(t=>t.state==="whole");
  shuffle(whole).slice(0,k).forEach(t=>{t.state="broken"; chaos.broken++;});
}
function drawChaos(){
  if(!chaos || chaos.over) return;
  if(chaos.newWave){ chaos.newWave=false; toast("🌀 Волна! Хаос сломал ещё врата!"); }
  const target=chaos.calm?15:25;
  render(`
    <div class="topbar">
      <span class="chip">🌀 Хаос Забвения</span>
      <span class="spacer"></span>
      <span class="chip">🔧 ${chaos.fixed}/${target}</span>
    </div>
    <p class="muted center" style="margin-bottom:10px;">Жми на треснувшие врата и чини их!</p>
    <div class="chaos-grid">
      ${chaos.tiles.map((t,i)=>{
        const {a,b}=parseKey(t.k);
        return `<div class="ctile ${t.state}"${t.state==="broken"?` tabindex="0" role="button" aria-label="Треснувшие врата ${a} на ${b} — починить"`:' aria-hidden="true"'} onclick="${t.state==="broken"?`chaosFix(${i})`:""}">
          ${t.state==="broken"?`${a}×${b}`:t.state==="fixed"?"✦":"▦"}</div>`;
      }).join("")}
    </div>
    ${chaosDoneCheck()}
  `);
}
function chaosDoneCheck(){
  const anyBroken=chaos.tiles.some(t=>t.state==="broken");
  const wavesLeft=!chaos.calm && chaos.timer;
  if(!anyBroken && !wavesLeft && chaos.broken>0){
    setTimeout(chaosEnd, 400); return "";
  }
  if(chaos.fixed>= (chaos.calm?15:25)){
    return `<div class="center" style="margin-top:12px;"><button class="btn primary" onclick="chaosEnd()">⚡ Добить Хаос!</button></div>`;
  }
  return "";
}
window.chaosFix = i=>{
  const t=chaos.tiles[i];
  const {a,b}=parseKey(t.k);
  const [x,y]=Math.random()<0.5?[a,b]:[b,a];
  askFact({
    a:x,b:y,
    onQuit:()=>drawChaos(),
    progress:`🔧 ${chaos.fixed}`,
    headerHtml:`<div class="center" style="font-size:26px;">🌀</div>`,
    onDone:(ok)=>{
      t.state="fixed"; chaos.fixed++;
      const f=ensureFact(x,y); f.reps++; scheduleNext(f, ok);
      if(!ok) f.errors++;
      S.stats.answers++; if(ok)S.stats.correct++;
      save(); drawChaos();
    }
  });
};
window.chaosEnd = ()=>{
  if(!chaos || chaos.over) return;
  chaos.over=true;
  if(chaos.timer) clearInterval(chaos.timer);
  const target=chaos.calm?15:25;
  const leftBroken=chaos.tiles.filter(t=>t.state==="broken").length;
  if(chaos.fixed>=target){
    S.chaosDone=true; S.sparks+=100;
    // фреска: досыпать клеток за финал
    for(let i=0;i<15;i++) grantShard();
    save(); sndWin(); fireworks(30, true);
    render(`
      <div class="quiz-wrap center col" style="gap:18px;">
        <div style="font-size:74px;">💥✨</div>
        <h1>Хаос рассыпался на сто искр!</h1>
        <p class="lore" style="max-width:440px; margin:0 auto;">«Ты больше не нуждаешься во мне.
        Ты сам — Магистр Множитель». </p>
        <p class="muted">+100 ✨ · Карта мира вспыхнула · Фреска почти собрана</p>
        <p class="muted">Остался последний шаг: <b style="color:var(--text)">финальный тест без магии</b> — 20 примеров, белый лист. Реши 18 — и Диплом твой.</p>
        <button class="btn primary big" onclick="startNoMagic(20, true)">📝 Финальный тест</button>
        <button class="btn ghostb" onclick="showMap()">Позже, на карту</button>
      </div>`);
  }else{
    // треснутые врата становятся «липкими» и просроченными — попадут в Уголок Забвения
    chaos.tiles.filter(t=>t.state==="broken").forEach(t=>{
      const f=S.facts[t.k];
      if(f){ f.errors=Math.max(f.errors,2); f.due=Math.min(f.due, Date.now()-DAY); }
    });
    save();
    render(`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:64px;">🌀</div>
        <h2>Хаос отступил… но оставил ${leftBroken} треснутых врат</h2>
        <p class="muted">Почини их в Уголке Забвения — и возвращайся. Бой можно повторить в любой момент.</p>
        <button class="btn primary" onclick="startChaos()">⚔️ Ещё раз</button>
        <button class="btn ghostb" onclick="showMap()">На карту</button>
      </div>`);
  }
  chaos=null;
};

