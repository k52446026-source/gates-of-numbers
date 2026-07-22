/* =====================================================================
   ВСТУПЛЕНИЕ: Врата Пустоты и Зеркала — GDD §4.1
   ===================================================================== */
/* Экран «Кто играет?» — выбор ребёнка (у каждого свой прогресс) */
window.showPlayerPick = ()=>{
  document.body.classList.remove("paper");
  const reg = loadRegistry();
  if(!reg.players.length){ return showAddPlayer(true); }
  // последний игравший — первым, для быстрого тапа
  const list = [...reg.players].sort((a,b)=> (a.id===reg.current?-1:0) - (b.id===reg.current?-1:0));
  render(`
    <div class="quiz-wrap center col" style="gap:18px; justify-content:center;">
      <div style="font-size:56px;">👋</div>
      <h1>Кто играет?</h1>
      <div class="players">
        ${list.map(p=>`<button class="player-tile ${p.id===reg.current?"cur":""}" onclick="selectPlayer('${p.id}')">
          <span class="pemoji">${p.emoji}</span><span class="pname">${esc(p.name)}</span></button>`).join("")}
        <button class="player-tile add" onclick="showAddPlayer()"><span class="pemoji">＋</span><span class="pname">Добавить</span></button>
      </div>
      <button class="btn ghostb small" onclick="showParentGate('players')">⚙️ Взрослым: управлять профилями</button>
    </div>
  `);
};
let addSel = "🦊";
window.showAddPlayer = (first)=>{
  addSel = PLAYER_EMOJI[Math.floor(Math.random()*PLAYER_EMOJI.length)];
  render(`
    <div class="quiz-wrap center col" style="gap:16px; justify-content:center;">
      <div style="font-size:52px;" id="addPreview">${addSel}</div>
      <h2>${first?"Давай знакомиться!":"Новый Хранитель"}</h2>
      <p class="muted">Как тебя зовут?</p>
      <input id="pname" maxlength="16" placeholder="Имя" autocomplete="off"
        style="font-size:22px; padding:12px 14px; width:min(280px,80vw); text-align:center; border-radius:14px; border:1px solid #ffffff33; background:var(--card2); color:var(--text);">
      <p class="muted" style="font-size:14px;">Выбери значок:</p>
      <div class="emoji-pick">
        ${PLAYER_EMOJI.map(e=>`<button class="ebtn ${e===addSel?"on":""}" onclick="pickEmoji('${e}')">${e}</button>`).join("")}
      </div>
      <button class="btn primary big" onclick="confirmAddPlayer()">🚪 В путь!</button>
      ${first?"":`<button class="btn ghostb small" onclick="showPlayerPick()">Назад</button>`}
    </div>
  `);
  setTimeout(()=>{const el=document.getElementById("pname"); el&&el.focus();},60);
};
window.pickEmoji = e=>{
  addSel = e;
  const pv=document.getElementById("addPreview"); if(pv) pv.textContent=e;
  document.querySelectorAll(".emoji-pick .ebtn").forEach(b=>b.classList.toggle("on", b.textContent===e));
};
window.confirmAddPlayer = ()=>{
  const nm = (document.getElementById("pname").value||"").trim() || "Хранитель";
  createPlayer(nm, addSel);
};
function showTitle(){
  applyBodyModes();
  const who = curPlayer ? `<div class="row" style="justify-content:center; gap:8px;"><span class="chip">${curPlayer.emoji} ${esc(curPlayer.name)}</span><button class="btn ghostb small" onclick="showPlayerPick()">👥 Сменить</button></div>` : "";
  render(`
    <div class="quiz-wrap center col" style="gap:20px;">
      <div style="font-size:74px;">🗝️✨</div>
      <h1>Хранители Числовых Врат</h1>
      ${who}
      <p class="muted" style="max-width:420px; margin:0 auto;">
        Мир Арифметика погас: Хаос Забвения запер 55 Числовых Врат.
        Каждый пример — дверь. Каждый ответ — удар молота.
      </p>
      ${S.profile ? `
        <button class="btn primary big" onclick="showMap()">Продолжить путь</button>
        <button class="btn ghostb small" onclick="showProfilePick()">Сменить профиль</button>
      `:`
        <button class="btn primary big" onclick="showProfilePick()">Начать путь Хранителя</button>
      `}
    </div>
  `);
}
window.showProfilePick = ()=>{
  render(`
    <div class="quiz-wrap col" style="gap:14px; justify-content:center;">
      <h2 class="center">Кто ты, Хранитель?</h2>
      <p class="muted center">Выбери, с чего начать путь. Взрослый может изменить это в Панели Магистра.</p>
      <button class="btn big" onclick="pickProfile('y7')">🌱 Я только знакомлюсь с умножением</button>
      <button class="btn big" onclick="startPlacement()">🎓 Я уже кое-что знаю — пропустить выученное</button>
      <button class="btn big" onclick="pickProfile('mast')">🗡️ Мне больше 10 — режим Мастера (сложнее)</button>
      <button class="btn big" onclick="startDiag()">🧪 Не уверен — проверь меня</button>
      <button class="btn ghostb" onclick="showParentGate('menu')">⚙️ Я взрослый — настроить профиль</button>
    </div>
  `);
};
window.pickProfile = p=>{
  S.profile=p;
  if(p==="anx"||p==="dys") S.settings.calm=true;
  if(p==="adhd") S.settings.static=true;
  save(); applyBodyModes();
  S.introDone ? showMap() : introStep(0);
};

/* Диагностический тест — GDD §3: 5 примеров на точность и скорость → автопрофиль */
let diag=null;
window.startDiag = ()=>{
  diag={qs:[[2,3],[3,4],[2,6],[4,5],[6,7]], i:0, ok:0, times:[]};
  diagNext();
};
window.diagNext = ()=>{
  if(!diag) return;
  if(diag.i>=diag.qs.length){
    const avg=diag.times.reduce((s,t)=>s+t,0)/diag.times.length;
    const okCnt=diag.ok, rec = okCnt>=4 && avg<5000 ? "y9" : "y7";
    diag=null;
    render(`
      <div class="quiz-wrap center col" style="gap:14px;">
        <div style="font-size:56px;">🧙‍♂️</div>
        <h2>Проверка пройдена!</h2>
        <p class="muted">Верных: ${okCnt} из 5 · среднее время: ${(avg/1000).toFixed(1)} сек</p>
        <p class="lore">«${rec==="y9"?"Ты быстр и точен. Пойдём бодрым шагом":"Начнём спокойным шагом — так знания держатся крепче"}» — Магистр.</p>
        <button class="btn primary big" onclick="pickProfile('${rec}')">Профиль «${PROFILES[rec].label}» — вперёд!</button>
        <button class="btn ghostb small" onclick="showProfilePick()">Выбрать самому</button>
        ${okCnt<=2?`<p class="muted" style="font-size:13px; max-width:400px; margin:0 auto;">Взрослому: если счёт даётся трудно, загляните в Панель Магистра — там есть профиль «Особый темп» с мягким режимом.</p>`:""}
      </div>`);
    return;
  }
  const [a,b]=diag.qs[diag.i];
  askFact({
    a,b, noHint:true,
    onQuit:()=>{ diag=null; showProfilePick(); },
    progress:`${diag.i+1} / 5`,
    headerHtml:`<div class="center muted" style="font-size:13.5px;">Проверка Магистра — просто отвечай, как получается</div>`,
    onDone:(ok,ms,att)=>{ if(ok&&att===1) diag.ok++; diag.times.push(ms); diag.i++; diagNext(); },
  });
};

/* =====================================================================
   ИСПЫТАНИЕ НА ЗНАНИЕ: ребёнок отмечает выученные таблицы, Магистр
   проверяет их и открывает — чтобы знаток шёл сразу к невыученным.
   ===================================================================== */
let placement=null;
window.startPlacement = (fromMap)=>{
  placement={picked:new Set(), fromMap:!!fromMap};
  drawPlacementPick();
};
function drawPlacementPick(){
  const chips=[];
  for(let n=2;n<=10;n++){
    const on=placement.picked.has(n);
    chips.push(`<button class="btn ${on?"primary":"ghostb"}" style="min-width:64px;" onclick="placeToggle(${n})">×${n}${on?" ✓":""}</button>`);
  }
  render(`
    <div class="quiz-wrap center col" style="gap:16px; justify-content:center;">
      <div style="font-size:52px;">🎓</div>
      <h2>Что ты уже умеешь?</h2>
      <p class="muted" style="max-width:440px; margin:0 auto;">Отметь таблицы, которые уже знаешь. Магистр коротко проверит их —
      и откроет, чтобы ты не тратил время на выученное, а шёл сразу к трудному.</p>
      <div class="row" style="flex-wrap:wrap; gap:8px; justify-content:center; max-width:380px;">${chips.join("")}</div>
      <button class="btn primary big" onclick="placeVerifyStart()" ${placement.picked.size?"":"disabled"}>Проверь меня, Магистр</button>
      <button class="btn ghostb small" onclick="${placement.fromMap?"placeCancel()":"showProfilePick()"}">${placement.fromMap?"Отмена":"Я лучше начну с начала"}</button>
    </div>
  `);
}
window.placeToggle = n=>{ placement.picked.has(n)?placement.picked.delete(n):placement.picked.add(n); drawPlacementPick(); };
window.placeCancel = ()=>{ placement=null; showMap(); };
window.placeVerifyStart = ()=>{
  if(!placement.picked.size) return;
  if(!S.profile) S.profile="y9"; // знаток идёт бодрым темпом (взрослый может сменить)
  // по 2 «трудных» факта на каждую отмеченную таблицу
  const qs=[];
  [...placement.picked].sort((a,b)=>a-b).forEach(n=>{
    const ms=shuffle([4,6,7,8,9]).slice(0,2);
    ms.forEach(m=>qs.push([n,m]));
  });
  placement.qs=qs; placement.i=0; placement.fail=new Set();
  placeVerifyNext();
};
window.placeVerifyNext = ()=>{
  if(!placement) return;
  if(placement.i>=placement.qs.length){ return placeApply(); }
  const [n,m]=placement.qs[placement.i];
  const [x,y]=Math.random()<0.5?[n,m]:[m,n];
  askFact({
    a:x,b:y, noHint:true,
    onQuit:()=>{ placement=null; showProfilePick(); },
    progress:`${placement.i+1} / ${placement.qs.length}`,
    headerHtml:`<div class="center muted" style="font-size:13.5px;">Испытание на знание — отвечай сам, без подсказок</div>`,
    onDone:(ok,ms,att)=>{ if(!(ok&&att===1)) placement.fail.add(n); placement.i++; placeVerifyNext(); },
  });
};
function placeApply(){
  const passed=[...placement.picked].filter(n=>!placement.fail.has(n)).sort((a,b)=>a-b);
  const failed=[...placement.picked].filter(n=>placement.fail.has(n)).sort((a,b)=>a-b);
  S.introDone=true; S.allLandsOpen=true;
  const now=Date.now();
  passed.forEach(n=>{
    for(let m=2;m<=10;m++){
      const f=ensureFact(n,m);
      if(f.reps===0){ // не трогаем уже честно открытые
        f.reps=1; f.origin=n; f.box=2; f.last=now; f.due=now + SRS_DAYS[2]*DAY/srsMult();
      }
    }
  });
  save(); applyBodyModes();
  if(passed.length) fireworks(16, true);
  const remaining=LANDS.map(l=>l.n).filter(n=>landKeys(n).some(k=>{const f=S.facts[k]; return !f||f.reps===0;}));
  placement=null;
  render(`
    <div class="quiz-wrap center col" style="gap:14px;">
      <div style="font-size:52px;">🎓✨</div>
      <h2>Магистр признал твои знания!</h2>
      ${passed.length?`<p class="lore">Открыты как выученные: <b>${passed.map(n=>"×"+n).join(", ")}</b>. Они будут иногда возвращаться на повтор — чтобы не забылись.</p>`:""}
      ${failed.length?`<p class="muted">Ещё стоит закрепить: <b>${failed.map(n=>"×"+n).join(", ")}</b> — тут пример-другой не дался. Начнём с них.</p>`:""}
      ${remaining.length?`<p class="muted">Осталось выучить: <b>${remaining.map(n=>"×"+n).join(", ")}</b>. Карта открыта — иди прямо к ним!</p>`
        :`<p class="muted">Ты открыл всю таблицу! Осталось одолеть боссов и пройти тест «Без магии».</p>`}
      <button class="btn primary big" onclick="showMap()">На карту мира</button>
    </div>
  `);
}

const INTRO=[
  {
    html:()=>`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:60px;">🧙‍♂️</div>
        <h2>Магистр Множитель</h2>
        <p class="lore">«Приветствую, Хранитель. Прежде чем идти к Вратам — два закона мира.
        Их не нужно запоминать. Они просто есть. Как гравитация».</p>
        <button class="btn primary" onclick="introStep(1)">Слушаю, Магистр</button>
      </div>`
  },
  {
    html:()=>`
      <div class="quiz-wrap center col" style="gap:14px;">
        <h2>⚫ Врата Пустоты</h2>
        <div style="font-size:44px;"><span id="vanish">🍎🍎🍎🍎🍎</span> → 🕳️</div>
        <p class="muted">Умножь на ноль — и ничего не останется.<br><b style="color:var(--text)">Любое число × 0 = 0</b></p>
        <div class="equation" style="font-size:36px;">7 × 0 = <span class="ans" style="min-width:60px;">?</span></div>
        <div class="row" style="justify-content:center; gap:10px;">
          <button class="btn" onclick="introZero(7)">7</button>
          <button class="btn" onclick="introZero(0)">0</button>
          <button class="btn" onclick="introZero(70)">70</button>
        </div>
      </div>`
  },
  {
    html:()=>`
      <div class="quiz-wrap center col" style="gap:14px;">
        <h2>🪞 Зеркальные Врата</h2>
        <div style="font-size:44px;">🦊 → 🪞 → 🦊</div>
        <p class="muted">Умножь на один — и всё останется собой.<br><b style="color:var(--text)">Любое число × 1 = само число</b></p>
        <div class="equation" style="font-size:36px;">9 × 1 = <span class="ans" style="min-width:60px;">?</span></div>
        <div class="row" style="justify-content:center; gap:10px;">
          <button class="btn" onclick="introOne(1)">1</button>
          <button class="btn" onclick="introOne(10)">10</button>
          <button class="btn" onclick="introOne(9)">9</button>
        </div>
      </div>`
  },
  {
    html:()=>`
      <div class="quiz-wrap center col" style="gap:16px;">
        <div style="font-size:60px;">🗺️</div>
        <h2>Девять земель ждут</h2>
        <p class="lore">«Смотри: всего врат — сто. Но врата-близнецы едины: 3×7 и 7×3 — одна дверь,
        просто с двух сторон. Тебе нужно открыть не 100 дверей, а 55. И десять зеркальных ты уже знаешь».</p>
        <p class="muted">Идём. Там, где начинается настоящая работа.</p>
        <button class="btn primary big" onclick="finishIntro()">На карту мира!</button>
      </div>`
  },
];
window.introStep = i=>{ render(INTRO[i].html()); };
window.introZero = v=>{
  if(v===0){ sndGood(); toast("Верно! Всё исчезло в Пустоте. ✔"); introStep(2); }
  else { sndBad(); toast("Хм… Пустота забирает всё. Попробуй ещё."); }
};
window.introOne = v=>{
  if(v===9){ sndGood(); toast("Верно! Зеркало ничего не меняет. ✔"); introStep(3); }
  else { sndBad(); toast("Зеркало отражает без изменений. Попробуй ещё."); }
};
window.finishIntro = ()=>{
  S.introDone=true; S.sparks+=10; save();
  fireworks(); sndWin();
  showMap();
};

