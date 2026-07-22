/* =====================================================================
   КАРТА МИРА
   ===================================================================== */
function agentLand(){
  // «Агент Хаоса» — земля с наибольшим числом призрачных врат
  let best=null, bestCnt=0;
  for(const l of LANDS){
    const c=landDueCount(l.n);
    if(c>bestCnt){ bestCnt=c; best=l.n; }
  }
  return bestCnt>0 ? best : null;
}
function newSessionCheck(){
  const today=new Date().toDateString();
  if(S.sessionDay!==today){
    const yesterday=new Date(Date.now()-DAY).toDateString();
    // серия только растёт: пропуск не «сжигает» её со стыдом, а начинает заново
    S.streak.days = S.streak.last===yesterday ? S.streak.days+1 : 1;
    S.streak.last=today;
    S.sessionDay=today; S.portalsThisSession=0; S.newToday=0; save();
  }
}
window.showMap = ()=>{
  applyBodyModes(); document.body.classList.remove("paper");
  newSessionCheck();
  const agent=agentLand();
  const dueTotal=Object.values(S.facts).filter(f=>isDue(f)).length;
  const gear=S.items.map(id=>{const it=SHOP.find(s=>s.id===id); return it?it.icon:"";}).join(" ");
  const lastArt=ARTIFACTS.filter(a=>S.artifacts.includes(a.id)).pop();
  const showStreak=S.streak.days>=2 && S.profile!=="anx";
  const sticky=stickyFacts();
  const portalMax = S.settings.portalMax!=null ? S.settings.portalMax : prof().portalMax;
  const showPortal = S.portalsThisSession < portalMax && totalOpen()>=13 && Math.random()<0.75;
  const bossesDone = Object.keys(S.bossDone).length;
  const noMagicOpen = bossesDone>=3;
  const mst=magicStage();
  const lastNM=S.noMagicResults.length?S.noMagicResults[S.noMagicResults.length-1]:null;
  const nmToday=lastNM && new Date(lastNM.ts).toDateString()===new Date().toDateString();
  const nudgeNM = mst>=2 && mst<4 && noMagicOpen && !nmToday;
  const tiles = LANDS.map(l=>{
    const open=landOpenCount(l.n), total=landKeys(l.n).length;
    const unlocked=landUnlocked(l.n);
    const done=S.bossDone[l.n] || (l.n===10 && S.chaosDone);
    const due=landDueCount(l.n);
    return `
      <div class="land-tile ${unlocked?"":"locked"} ${done?"done":""}" tabindex="0" role="button"
           aria-label="${l.name}, таблица на ${l.n}, ${!unlocked?"заперта":done?"пройдена":due>0?due+" врат шепчут":"открыто "+open+" из "+total+" врат"}"
           style="background:linear-gradient(#0000004d,#0000004d), linear-gradient(160deg, ${l.color}cc, ${l.color}55);"
           onclick="${unlocked?`showLand(${l.n})`:`lockedLand(${l.n})`}">
        ${agent===l.n?'<div class="agent" title="Агент Хаоса!">🌀</div>':""}
        <div class="lnum">×${l.n}</div>
        <div class="lname">${l.icon} ${l.name}</div>
        <div class="lprog">${unlocked? (due>0?`👻 ${due} шепчут`:`${open}/${total} врат`) : "🔒"}</div>
      </div>`;
  }).join("");
  render(`
    <div class="topbar">
      <span class="chip">✨ ${S.sparks}</span>
      <span class="chip">🧩 ${S.frescoCells.length}/100</span>
      <span class="spacer"></span>
      <span class="chip">🚪 ${totalOpen()}/55</span>
    </div>
    <div class="row" style="margin-bottom:10px; flex-wrap:wrap; gap:8px;">
      <button class="chip" style="cursor:pointer; font-family:inherit; border:1px solid #ffffff14;" onclick="showPlayerPick()" title="Сменить игрока">${curPlayer?curPlayer.emoji+" "+esc(curPlayer.name):"🧙 Хранитель"}${gear?" "+gear:""}</button>
      ${lastArt?`<span class="chip">🏅 «${esc(lastArt.title)}»</span>`:""}
      ${showStreak?`<span class="chip">🔥 на посту ${S.streak.days} дн.</span>`:""}
    </div>
    ${dueTotal>0?`<button class="banner" style="margin-bottom:12px; display:block; width:100%; text-align:left; cursor:pointer; font-family:inherit; color:var(--text);" onclick="startReview()">
      🌀 Врата шепчут: <b>${dueTotal}</b>${agent?` · Агент Хаоса в «${esc(landOf(agent).name)}»`:""} — <b>⚡ Отразить угрозу!</b></button>`:""}
    ${showPortal?`<button class="banner portal-btn" style="margin-bottom:12px; display:block; width:100%; text-align:left; cursor:pointer; font-family:inherit; color:#e9d5ff;" onclick="startPortal()">
      🌀 <b>Портал Хаоса открылся!</b> Блиц из разных земель — двойные искры и осколок лора.</button>`:""}
    ${nudgeNM?`<button class="banner" style="margin-bottom:12px; display:block; width:100%; text-align:left; cursor:pointer; font-family:inherit; color:var(--text); background:linear-gradient(90deg,#4a4458cc,#6b6272cc); border-color:#c9c3d6aa;" onclick="startNoMagic(10)">
      🕯️ Магия тает — и это хорошо: ты становишься сильнее её. Попробуй сегодня <b>«Без магии»</b>.</button>`:""}
    ${mst>=4?`<p class="lore" style="margin-bottom:12px;">«Мир помнит себя. Магия больше не нужна — но врата всегда открыты для тебя» — Магистр.</p>`:""}
    <div class="lands">${tiles}</div>
    <div class="map-actions">
      <button class="btn" style="background:#243a52;" onclick="showTrainHub()">🎯 Тренировка</button>
      <button class="btn" onclick="showForge()">⚒️ Кузница</button>
      <button class="btn" onclick="showWorkshop()">🔬 Мастерская</button>
      <button class="btn" onclick="showHall()">🏛️ Зал Славы</button>
      <button class="btn ghostb" onclick="showHelp()">❓ Как играть</button>
      <button class="btn ghostb" onclick="showParentGate('map')">⚙️ Панель Магистра</button>
    </div>
  `);
};
window.lockedLand = n=>{
  const idx=LANDS.findIndex(l=>l.n===n);
  toast(`🔒 Сначала открой все врата: <b>${esc(LANDS[idx-1].name)}</b>`);
};

