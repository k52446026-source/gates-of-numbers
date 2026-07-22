/* =====================================================================
   ХАБ «ТРЕНИРОВКА»: все режимы-тренажёры в одном месте, во главе — цель
   «решать без игры» (принцип ГДД §21: игра должна сама себя отменить)
   ===================================================================== */
window.showTrainHub = ()=>{
  applyBodyModes(); document.body.classList.remove("paper");
  const due=Object.values(S.facts).filter(f=>isDue(f)).length;
  const sticky=stickyFacts();
  const portalMax=S.settings.portalMax!=null?S.settings.portalMax:prof().portalMax;
  const portalOk=S.portalsThisSession<portalMax && totalOpen()>=13;
  const calm=S.settings.calm||prof().calm;
  const noMagicOpen=Object.keys(S.bossDone).length>=3;
  const card=(style,onclick,icon,title,desc)=>`<button class="train-card" style="${style}" onclick="${onclick}">
    <span class="tc-ic">${icon}</span><span class="tc-tx"><b>${title}</b><span class="muted">${desc}</span></span></button>`;
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← Карта</button>
      <span class="spacer"></span><span class="chip">🎯 Тренировка</span>
    </div>
    <p class="muted" style="margin:4px 0 14px;">Оттачивай то, что уже знаешь — чтобы однажды решать <b style="color:var(--text)">без игры</b>: у доски, за 2 секунды.${S.diploma?" Диплом у тебя — ты уже можешь!":""}</p>
    <div class="col" style="gap:10px;">
      ${noMagicOpen?card("background:#f5f5f0;color:#222;","startNoMagic(10)","📝","Без магии","Реши как на контрольной — без гномов и молота. Это и есть цель."):""}
      ${S.chaosDone&&!S.diploma?card("background:#fdf6e3;color:#4a3200;","startNoMagic(20,true)","🏅","Финальный тест Магистра","20 примеров, белый лист. 18 верных — Диплом."):""}
      ${due>0?card("","startReview()","👻","Повтори призраков ("+due+")","Освежить то, что начало забываться."):""}
      ${card("background:#1f3a2e;","startMarathon()","🏃","Марафон","Прогнать всю таблицу или одну — сразу, без ожидания.")}
      ${sticky.length>=3?card("background:#2d1b4e;","showCorner()","🕯️","Уголок Забвения ("+sticky.length+")","Забрать самые липкие примеры — там редкий лут."):""}
      ${!calm?card("background:#3a1520;border:1px solid #f0a5a555;","startTrial()","🗡️","Испытание Мастера"+(S.trialBest?" · "+["🥉","🥈","🥇"][S.trialBest-1]:""),"Один ответ, на время, 3 жизни. Можно проиграть."):""}
      ${portalOk?card("background:radial-gradient(circle at 50% 40%,#7c3aed,#2e1065);color:#e9d5ff;","startPortal()","🌀","Портал Хаоса","Блиц из разных таблиц — учит переключаться."):""}
    </div>
    ${calm?`<p class="muted" style="font-size:13px; margin-top:14px;">🕊️ Спокойный режим: испытания на время скрыты. Взрослый может изменить это в Панели Магистра.</p>`:""}
  `);
};

/* =====================================================================
   КУЗНИЦА — GDD §14
   ===================================================================== */
window.showForge = ()=>{
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← Карта</button>
      <span class="spacer"></span><span class="chip">✨ ${S.sparks}</span>
    </div>
    <h2>⚒️ Кузница Хранителя</h2>
    <p class="muted" style="margin:6px 0 14px;">Трать искры на экипировку. Искры — застывшие правильные ответы!</p>
    <div class="shop">
      ${SHOP.map(it=>{
        const owned=S.items.includes(it.id);
        return `<div class="shop-item ${owned?"owned":""}" tabindex="0" role="button" aria-label="${esc(it.name)}, ${owned?"куплено":"цена "+it.price+" искр"}" onclick="buyItem('${it.id}')">
          <div class="icon">${it.icon}</div>
          <div style="font-size:13px; margin:4px 0;">${esc(it.name)}</div>
          <div class="price">${owned?"✔ куплено":"✨ "+it.price}</div>
        </div>`;
      }).join("")}
    </div>
  `);
};
window.buyItem = id=>{
  const it=SHOP.find(x=>x.id===id);
  if(S.items.includes(id)){ toast(`${it.icon} Уже в твоём арсенале!`); return; }
  if(S.sparks<it.price){ toast(`Не хватает искр: нужно ✨${it.price}. Открывай врата!`); sndBad(); return; }
  S.sparks-=it.price; S.items.push(id); save(); sndGood(); fireworks(10);
  toast(`${it.icon} ${esc(it.name)} — твой!`);
  showForge();
};

/* =====================================================================
   МАСТЕРСКАЯ МАГИСТРА — GDD §10
   ===================================================================== */
let wsFact={a:7,b:8};
window.showWorkshop = (tab)=>{
  tab=tab||"razbor";
  const {a,b}=wsFact;
  const tabs=[["razbor","🔍 Разбор"],["patterns","🧩 Паттерны"],["abacus","🧮 Абакус"],["tricks","🧙‍♂️ Приёмы"]];
  let body="";
  if(tab==="razbor"){
    const k=Math.min(a,b), t=Math.max(a,b);
    body=`
      <div class="col">
        <div class="row" style="justify-content:center; gap:6px; flex-wrap:wrap;">
          ${[[6,7],[7,8],[8,9],[4,7],[6,8],[3,9]].map(([x,y])=>
            `<button class="btn small ${wsFact.a===x&&wsFact.b===y?"primary":""}" onclick="wsPick(${x},${y})">${x}×${y}</button>`).join("")}
        </div>
        <div class="card center">
          <div class="equation" style="font-size:36px;">${a} × ${b} = <b style="color:var(--accent)">${a*b}</b></div>
        </div>
        <div class="hintbox">Путь 1: ${k}×${t} = ${k}×${t-1} + ${k} = ${k*(t-1)} + ${k} = <b>${k*t}</b></div>
        <div class="hintbox">Путь 2: ${k}×${t} = ${k}×10 − ${k}×${10-t} = ${k*10} − ${k*(10-t)} = <b>${k*t}</b></div>
        <p class="muted center">Два пути — один ответ. Выбирай тот, что короче для тебя.</p>
      </div>`;
  }else if(tab==="patterns"){
    body=`
      <div class="col">
        <div class="card">🔵 Все ответы <b>×5</b> заканчиваются на 0 или 5: 5, 10, 15, 20, 25…</div>
        <div class="card">🔴 У ответов <b>×9</b> сумма цифр = 9: 18→1+8=9, 27→2+7=9, 36→3+6=9…</div>
        <div class="card">🟢 <b>×2, ×4, ×6, ×8</b> — ответы всегда чётные.</div>
        <div class="card">🟡 <b>×10</b> — просто припиши ноль.</div>
        <div class="card">🔁 <b>Близнецы:</b> 3×7 = 7×3. Всегда. Половина таблицы уже у тебя!</div>
      </div>`;
  }else if(tab==="abacus"){
    body=`
      <div class="col center" id="abacusBox">
        <p class="muted">Собери число <b id="abTarget" style="color:var(--accent); font-size:22px;"></b> из десятков и единиц:</p>
        <div style="font-size:34px; min-height:50px;" id="abView"></div>
        <div style="font-size:26px; font-weight:800;" id="abVal">0</div>
        <div class="row" style="justify-content:center; gap:8px; flex-wrap:wrap;">
          <button class="btn" onclick="abAdd(10)">+ 🟠 десяток</button>
          <button class="btn" onclick="abAdd(1)">+ 🔵 единица</button>
          <button class="btn ghostb" onclick="abAdd(-10)">− десяток</button>
          <button class="btn ghostb" onclick="abAdd(-1)">− единица</button>
        </div>
        <button class="btn primary" onclick="abCheck()">Проверить</button>
      </div>`;
    setTimeout(abNew, 0);
  }else{
    body=`<div class="col">${LANDS.filter(l=>l.n>=2).map(l=>
      `<div class="card" style="border-left:4px solid ${l.color};"><b>${l.icon} ×${l.n}:</b> ${esc(l.trick)}</div>`).join("")}</div>`;
  }
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← Карта</button>
      <span class="spacer"></span><span class="chip">🔬 Мастерская</span>
    </div>
    <div class="row" style="flex-wrap:wrap; gap:6px; margin-bottom:14px;">
      ${tabs.map(([id,label])=>`<button class="btn small ${tab===id?"primary":""}" onclick="showWorkshop('${id}')">${label}</button>`).join("")}
    </div>
    ${body}
  `);
};
window.wsPick=(a,b)=>{ wsFact={a,b}; showWorkshop("razbor"); };
let abTarget=56, abVal=0;
window.abNew=()=>{
  const pairs=[[6,7],[7,8],[8,9],[6,9],[4,9],[7,7]];
  const [x,y]=rnd(pairs); abTarget=x*y; abVal=0; abDraw();
  const el=document.getElementById("abTarget"); if(el) el.textContent=`${x}×${y} = ${abTarget}`;
};
window.abAdd=v=>{ abVal=Math.max(0,Math.min(100,abVal+v)); abDraw(); };
function abDraw(){
  const t=Math.floor(abVal/10), u=abVal%10;
  const view=document.getElementById("abView"), val=document.getElementById("abVal");
  if(view) view.textContent="🟠".repeat(t)+" "+"🔵".repeat(u);
  if(val) val.textContent=`${t} десятков + ${u} единиц = ${abVal}`;
}
window.abCheck=()=>{
  if(abVal===abTarget){ sndGood(); toast("✔ Точно! Число собрано."); fireworks(8); setTimeout(abNew,700); }
  else{ sndBad(); toast(`Пока ${abVal}. Нужно ${abTarget}. ${abVal<abTarget?"Добавь":"Убери"} ещё!`); }
};

/* =====================================================================
   ЗАЛ СЛАВЫ: фреска, артефакты, диплом — GDD §14
   ===================================================================== */
window.showHall = ()=>{
  const cells=Array.from({length:100},(_,i)=>
    `<div class="fcell ${S.frescoCells.includes(i)?"on":""}" style="background-position:${(i%10)*11.11}% ${Math.floor(i/10)*11.11}%"></div>`).join("");
  const arts=ARTIFACTS.filter(a=>S.artifacts.includes(a.id));
  const acc=S.stats.answers?Math.round(S.stats.correct/S.stats.answers*100):0;
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← Карта</button>
      <span class="spacer"></span><span class="chip">🏛️ Зал Славы</span>
    </div>
    <div class="col">
      <div class="card center">
        <h3 style="margin-bottom:10px;">Фреска Арифметики · ${S.frescoCells.length}/100</h3>
        <div class="fresco">${cells}</div>
        <p class="muted" style="margin-top:8px; font-size:13px;">Осколки лора открывают фрагменты. Повторяй старые врата — собирай картину мира.</p>
      </div>
      <div class="card">
        <h3>📜 Книга лора · ${[...new Set(S.shards)].length}/${LORE.length}</h3>
        <div class="col" style="margin-top:10px; gap:8px;">
          ${LORE.map((t,i)=>[...new Set(S.shards)].includes(i)
            ? `<p class="lore">«${esc(t)}»</p>`
            : `<p class="muted" style="font-size:13.5px;">🔒 Осколок ещё в тумане…</p>`).join("")}
        </div>
      </div>
      <div class="card">
        <h3>🏆 Артефакты и титулы</h3>
        ${arts.length?arts.map(a=>`<p style="margin-top:8px;">${a.icon} <b>${esc(a.name)}</b> — «${esc(a.title)}»</p>`).join("")
          :'<p class="muted" style="margin-top:8px;">Пока пусто. Артефакты дают боссы (без ошибок) и Уголок Забвения.</p>'}
      </div>
      <div class="card">
        <h3>📊 Хроника Хранителя</h3>
        <p class="muted" style="margin-top:8px;">Ответов: ${S.stats.answers} · Точность: ${acc}% · Врат открыто: ${totalOpen()}/55 · Боссов повержено: ${Object.keys(S.bossDone).length}${S.chaosDone?" + Хаос":""}${Object.keys(S.blitzDone).length?` · ⚡ Боёв-молний выиграно: ${Object.keys(S.blitzDone).length}/9`:""}${S.trialBest?` · 🗡️ Испытание Мастера: ${["Бронза","Серебро","Золото"][S.trialBest-1]}`:""}</p>
        ${S.noMagicResults.length?`<p class="muted">Последняя «контрольная»: ${S.noMagicResults.at(-1).correct}/${S.noMagicResults.at(-1).total}</p>`:""}
      </div>
      ${S.chaosDone&&!S.diploma?`
      <div class="card center">
        <h3>🏅 Диплом Магистра ждёт</h3>
        <p class="muted" style="margin:8px 0;">Хаос повержен. Остался финальный тест: 20 примеров, белый лист, 18 верных — и Диплом твой.</p>
        <button class="btn primary" onclick="startNoMagic(20, true)">📝 Пройти финальный тест</button>
      </div>`:""}
      ${S.diploma?`
      <div class="diploma">
        <div style="font-size:40px;">🏅</div>
        <h2>ДИПЛОМ МАГИСТРА</h2>
        <p>Сим удостоверяется, что Хранитель Числовых Врат<br>прошёл все девять земель, победил Хаос Забвения<br>и владеет таблицей умножения<br><b>без гномов, без магии, без страха.</b></p>
        <p style="margin-top:12px; font-style:italic;">«Это просто 56». — Магистр Множитель</p>
      </div>
      <button class="btn" onclick="window.print()">🖨️ Распечатать диплом</button>`:""}
    </div>
  `);
};

/* =====================================================================
   ПАНЕЛЬ МАГИСТРА (родитель/учитель) — GDD §13
   ===================================================================== */
/* куда вернуться из панели: 'menu' (пришли из выбора профиля) или 'map' (с карты) */
let parentReturn = "map";
window.exitParent = ()=>{ parentReturn==="players" ? showPlayerPick() : parentReturn==="menu" ? showProfilePick() : showMap(); };
window.showParentGate = (from)=>{
  parentReturn = from || (S.profile ? "map" : "menu");
  const x=Math.floor(Math.random()*30)+13, y=Math.floor(Math.random()*4)+3;
  render(`
    <div class="quiz-wrap center col" style="gap:14px;">
      <h2>⚙️ Панель Магистра</h2>
      <p class="muted">Вход для взрослых. Сколько будет <b style="color:var(--text)">${x} × ${y}</b>?</p>
      <input id="pgate" inputmode="numeric" style="font-size:24px; padding:10px; width:120px; text-align:center; border-radius:12px; border:1px solid #ffffff33; background:var(--card2); color:var(--text);">
      <button class="btn primary" onclick="(+document.getElementById('pgate').value===${x*y})?showParent():toast('Неверно. Это защита от юных Хранителей 🙂')">Войти</button>
      <button class="btn ghostb small" onclick="exitParent()">Назад</button>
    </div>
  `);
  setTimeout(()=>{const el=document.getElementById("pgate"); el&&el.focus();},50);
};
window.showTitleBack = ()=>showTitle();
window.showParent = ()=>{
  const heat = Object.entries(S.facts).filter(([k,f])=>f.reps>0 && f.errors>0)
    .sort((a,b)=>b[1].errors-a[1].errors).slice(0,6);
  const learned=Object.values(S.facts).filter(f=>f.reps>0).length;
  const auto=Object.values(S.facts).filter(f=>f.reps>=3 && f.ema && f.ema<2000).length;
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="exitParent()">← Назад</button>
      <span class="spacer"></span><span class="chip">⚙️ Для взрослых</span>
    </div>
    <div class="col">
      <div class="card">
        <h3>Профиль ребёнка</h3>
        <div class="settings-row"><span>Профиль темпа</span>
          <select onchange="setProfile(this.value)">
            ${Object.entries(PROFILES).map(([k,p])=>`<option value="${k}" ${S.profile===k?"selected":""}>${p.label}</option>`).join("")}
          </select></div>
        <p class="muted" style="font-size:13px; margin-top:6px;">
          «Особый темп» — для дискалькулии: повторения чаще, без таймеров, крупные группы точек, мягкие боссы.
          «Фокус» — для СДВГ: статичный режим, короткие порталы. «Спокойствие» — без волн и жёстких боссов.</p>
        <div class="settings-row"><span>🎓 Испытание на знание<br><span class="muted" style="font-size:12.5px;">открыть уже выученные таблицы, пропустив их</span></span>
          <button class="btn small" onclick="startPlacement(true)">Запустить</button></div>
        <p class="muted" style="font-size:13px; margin-top:8px;">🕯️ Отмена магии (GDD §9): этап <b style="color:var(--text)">${magicStage()} из 4</b> — «${MAGIC_STAGES[magicStage()]}».
          Растёт с победами над боссами: салюты и декор тускнеют, экран примера очищается, после победы над Хаосом мир становится светлым. Цель — умножение без игры.</p>
      </div>
      <div class="card">
        <h3>Настройки</h3>
        <div class="settings-row"><span>🔊 Звук</span><button class="btn small" onclick="tgl('sound')">${S.settings.sound?"Вкл":"Выкл"}</button></div>
        <div class="settings-row"><span>🗣️ Голос (мантры)</span><button class="btn small" onclick="tgl('voice')">${S.settings.voice?"Вкл":"Выкл"}</button></div>
        <div class="settings-row"><span>🖼️ Статичный режим (без анимаций)</span><button class="btn small" onclick="tgl('static')">${S.settings.static?"Вкл":"Выкл"}</button></div>
        <div class="settings-row"><span>🕊️ Спокойный режим (без волн Хаоса)</span><button class="btn small" onclick="tgl('calm')">${S.settings.calm?"Вкл":"Выкл"}</button></div>
        <div class="settings-row"><span>👻 Скорость тускнения (SRS)</span>
          <select onchange="S.settings.srsMult=+this.value; save();">
            ${[0.5,1,1.5,2].map(v=>`<option value="${v}" ${S.settings.srsMult===v?"selected":""}>×${v}</option>`).join("")}
          </select></div>
        <div class="settings-row"><span>🌀 Порталов Хаоса за день</span>
          <select onchange="S.settings.portalMax=+this.value; save();">
            ${[0,1,2,3].map(v=>`<option value="${v}" ${(S.settings.portalMax!=null?S.settings.portalMax:prof().portalMax)===v?"selected":""}>${v}</option>`).join("")}
          </select></div>
      </div>
      <div class="card">
        <h3>🔥 Тепловая карта трудностей</h3>
        ${heat.length?`<div class="row" style="flex-wrap:wrap; gap:8px; margin-top:8px;">
          ${heat.map(([k,f])=>{const{a,b}=parseKey(k);return `<span class="chip" style="border-color:#f0a5a566;">⚠️ ${a}×${b} · ${f.errors} ош.${f.ema?` · ${(f.ema/1000).toFixed(1)}с`:""}</span>`;}).join("")}
        </div>
        <p class="muted" style="font-size:13px; margin-top:8px;">Рекомендация: Уголок Забвения + разбор в Мастерской (декомпозиция).</p>`
        :'<p class="muted" style="margin-top:6px;">Стойких ошибок нет. Отличный ход!</p>'}
        <p class="muted" style="font-size:13px; margin-top:8px;">⏱️ Автоматизировано (ответ быстрее 2 сек, от 3 повторений): <b style="color:var(--text)">${auto}</b> из ${learned} выученных фактов. Цель — все 45 к 4-й неделе.</p>
      </div>
      <div class="card">
        <h3>🗣️ Режим «Родитель-Хаос»</h3>
        <p class="muted" style="font-size:13.5px; margin-top:6px;">Диктуйте ребёнку примеры голосом — а он «отбивает» их здесь:</p>
        <button class="btn" style="margin-top:8px;" onclick="startParentChaos()">Открыть чистый тренажёр</button>
      </div>
      <div class="card">
        <h3>👥 Дети (профили)</h3>
        <p class="muted" style="font-size:13px; margin:6px 0;">У каждого ребёнка свой прогресс на этом устройстве. Сейчас играет: <b style="color:var(--text)">${curPlayer?esc(curPlayer.emoji+" "+curPlayer.name):"—"}</b></p>
        <div class="col" style="gap:6px; margin-top:6px;">
          ${loadRegistry().players.map(p=>`<div class="settings-row"><span>${p.emoji} ${esc(p.name)}${curPlayer&&p.id===curPlayer.id?' <span class="muted">· сейчас</span>':""}</span>
            <span class="row" style="gap:6px;">
              <button class="btn small ghostb" onclick="selectPlayer('${p.id}')">Играть</button>
              <button class="btn small" style="background:#5b2333;" onclick="parentDeletePlayer('${p.id}')">🗑️</button>
            </span></div>`).join("")}
        </div>
        <button class="btn small" style="margin-top:8px;" onclick="showAddPlayer()">＋ Добавить ребёнка</button>
      </div>
      <div class="card">
        <h3>📖 Как это устроено</h3>
        <p class="muted" style="font-size:13px; margin:6px 0;">Метод, как помочь ребёнку, про сохранения и приватность — коротко на одном экране.</p>
        <button class="btn small" onclick="showHelp('grown')">Открыть руководство</button>
      </div>
      <div class="card">
        <h3>Данные</h3>
        <p class="muted" style="font-size:13px; margin:6px 0;">Хранится только прогресс по примерам, локально на этом устройстве. Без сети.</p>
        <button class="btn small" style="background:#5b2333;" onclick="parentResetCurrent()">🗑️ Сбросить прогресс этого ребёнка</button>
      </div>
    </div>
  `);
};
window.parentDeletePlayer = id=>{
  const reg=loadRegistry();
  const p=reg.players.find(x=>x.id===id); if(!p) return;
  if(reg.players.length<=1){ toast("Нельзя удалить единственного игрока."); return; }
  if(!confirm(`Удалить профиль «${p.name}» и весь его прогресс?`)) return;
  const wasCurrent = curPlayer && curPlayer.id===id;
  deletePlayer(id);
  if(wasCurrent) return selectPlayer(loadRegistry().current);
  showParent();
};
window.parentResetCurrent = ()=>{
  if(!curPlayer) return;
  if(!confirm(`Стереть прогресс профиля «${curPlayer.name}»?`)) return;
  S=defaultState(); save(); applyBodyModes(); showTitle();
};
window.tgl = k=>{ S.settings[k]=!S.settings[k]; save(); applyBodyModes(); showParent(); };
window.setProfile = p=>{ S.profile=p; save(); applyBodyModes(); toast("Профиль обновлён: "+PROFILES[p].label); };
/* Родитель-Хаос: свободный тренажёр — взрослый диктует любой пример */
window.startParentChaos = ()=>{
  const a=Math.floor(Math.random()*9)+2, b=Math.floor(Math.random()*9)+2;
  askFact({
    a,b, paper:true, noHint:true,
    onQuit:()=>showParent(),
    headerHtml:`<div class="center muted" style="font-size:13px;">Режим «Родитель-Хаос» — реши и получишь следующий</div>`,
    onDone:(ok)=>{
      S.stats.answers++; if(ok)S.stats.correct++;
      const f=ensureFact(a,b); if(f.reps>0){ if(!ok)f.errors++; }
      save();
      toast(ok?"✔ Верно!":"Запомни: "+a+"×"+b+"="+a*b);
      startParentChaos();
    }
  });
};

/* =====================================================================
   КАК ИГРАТЬ — встроенная инструкция (ребёнку и взрослому)
   ===================================================================== */
window.showHelp = (mode)=>{
  const back = `<button class="btn small ghostb" onclick="showHelp()">← К инструкции</button>`;
  const toMap = `<button class="btn ghostb" onclick="showMap()">🗺️ На карту</button>`;

  if(mode==="kid"){
    render(`
      <div class="topbar">${back}<span class="spacer"></span><span class="chip">🗝️ Для Хранителя</span></div>
      <div class="col">
        <h2 class="center">Как играть</h2>
        <div class="card">
          <h3>Что нажимать</h3>
          <p class="muted">Смотри на пример, например <b style="color:var(--text)">6 × 7</b>, и набери ответ на кнопках.
          Нажми <b style="color:var(--text)">✓</b>, чтобы ответить. Ошибся кнопкой — <b style="color:var(--text)">⌫</b> сотрёт.</p>
        </div>
        <div class="card">
          <h3>🗺️ Карта мира</h3>
          <p class="muted">На карте — 9 земель. В каждой Врата с примерами. Открывай их правильными ответами.
          Открыл все Врата земли — идёшь дальше!</p>
        </div>
        <div class="card">
          <h3>⚔️ Секреты Хранителя</h3>
          <p class="muted" style="line-height:1.7;">
          • <b style="color:var(--text)">Ошибка — не проигрыш!</b> Врата сами подскажут дорогу. Пробуй ещё раз.<br>
          • <b style="color:var(--text)">Одна дверь на двоих:</b> знаешь 3×7 — знаешь и 7×3.<br>
          • <b style="color:var(--text)">Босс</b> 🐉 — чини трещины ответами. Без ошибок — редкое сокровище!<br>
          • <b style="color:var(--text)">Бой-молния</b> ⚡ — отвечай быстрее 3 секунд и лови молнии.<br>
          • <b style="color:var(--text)">Портал Хаоса</b> 🌀 — примеры вперемешку, двойные искры.<br>
          • <b style="color:var(--text)">Искры</b> ✨ — твоё золото. Копи и покупай снаряжение в Кузнице 🔨.</p>
        </div>
        <div class="card">
          <h3>👻 Врата-призраки</h3>
          <p class="muted">Если долго не заходить, Врата мерцают и тускнеют — забываются. Заглядывай почаще,
          ответь на пример — и они снова засияют. 🌟</p>
        </div>
        <div class="card">
          <h3>🏆 Твоя цель</h3>
          <p class="muted">Победи всех боссов, пройди Уголок Забвения 🕯️, а потом — самого Хаоса Забвения.
          В конце тебя ждёт Диплом Магистра 🏅. Ты справишься!</p>
        </div>
        <div class="center">${toMap}</div>
      </div>
    `);
    return;
  }

  if(mode==="grown"){
    render(`
      <div class="topbar">${back}<span class="spacer"></span><span class="chip">👩‍🏫 Для взрослого</span></div>
      <div class="col">
        <h2 class="center">Руководство для взрослого</h2>
        <div class="card">
          <h3>Что это</h3>
          <p class="muted">Тренажёр таблицы умножения (×2…×10) для детей ~7–11 лет. В основе — интервальное
          повторение (пример всплывает, когда начинает забываться) и приёмы-декомпозиции
          (6×7 = 6×5 + 6×2) — понимание вместо зубрёжки.</p>
        </div>
        <div class="card">
          <h3>Как помочь</h3>
          <p class="muted" style="line-height:1.7;">
          • <b style="color:var(--text)">Ошибка — не провал:</b> игра подсказывает, а не ругает. Не подсказывайте ответ сразу.<br>
          • <b style="color:var(--text)">5–10 минут в день</b> лучше, чем один долгий раз в неделю.<br>
          • Если пример «не даётся» — загляните в <b style="color:var(--text)">Уголок Забвения</b>: он собирает то, что убегает.<br>
          • Хвалите за попытку, а не только за верный ответ.</p>
        </div>
        <div class="card">
          <h3>Темп и настройки</h3>
          <p class="muted">Профиль темпа и режимы (звук, спокойный режим, меньше анимаций, частота Портала)
          настраиваются в <b style="color:var(--text)">Панели Магистра</b> — отдельно для каждого ребёнка.</p>
          <button class="btn small" style="margin-top:8px;" onclick="showParentGate('map')">⚙️ Открыть Панель Магистра</button>
        </div>
        <div class="card">
          <h3>💾 Про сохранения</h3>
          <p class="muted" style="line-height:1.6;">Прогресс хранится <b style="color:var(--text)">в этом браузере, на этом устройстве</b>,
          и между устройствами не синхронизируется — пусть ребёнок играет на одном.
          Не очищайте «данные сайта» — это сотрёт прогресс. Если вверху появился
          <b style="color:var(--bad)">красный баннер</b> — на устройстве кончилось место.</p>
        </div>
        <div class="card">
          <h3>🔒 Приватность</h3>
          <p class="muted">Нет аккаунтов, рекламы и сбора данных — ничего не отправляется в интернет.
          На один планшет можно завести несколько детей: у каждого свой профиль в «Кто играет?».</p>
        </div>
        <div class="center">${toMap}</div>
      </div>
    `);
    return;
  }

  // страница выбора
  render(`
    <div class="topbar">
      <button class="btn small ghostb" onclick="showMap()">← На карту</button>
      <span class="spacer"></span><span class="chip">❓ Как играть</span>
    </div>
    <div class="quiz-wrap center col" style="gap:16px;">
      <div style="font-size:60px;">🗝️</div>
      <h2>Как играть</h2>
      <p class="muted" style="max-width:420px; margin:0 auto;">Короткая инструкция. Выбери, кто читает.</p>
      <button class="btn primary big" onclick="showHelp('kid')">🗝️ Я играю — покажи мне</button>
      <button class="btn big" onclick="showHelp('grown')">👩‍🏫 Я взрослый — как это устроено</button>
    </div>
  `);
};

