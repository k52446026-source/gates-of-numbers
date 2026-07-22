/* Смоук-тесты «Хранителей Числовых Врат».
   Прогоняют ключевые инварианты режимов за секунды вместо ручной проверки.
   Не входят в сборку игры (build.mjs их не включает) — только для tests.html.
   Запуск в консоли собранной игры или через tests.html:  await runSmoke()
*/
(function(){
  const R = [];
  const ok = (name, cond)=> R.push({name, pass: !!cond});
  const sleep = ms => new Promise(r=>setTimeout(r,ms));

  // сброс на чистого тестового игрока
  function fresh(profile){
    try{ localStorage.clear(); }catch(e){}
    curPlayer=null; S=null; trial=null; boss=null; marathon=null; chaos=null;
    quizState=null; if(typeof clearQuizTimer==="function") clearQuizTimer();
    createPlayer("Тест","🦊");
    if(profile){ S.profile=profile; }
    S.introDone=true; save();
  }
  const answer = v => { quizState.input=String(v); numOk(); };
  async function waitQuiz(ms=2500){ const t=Date.now(); while(Date.now()-t<ms){ if(quizState) return true; await sleep(20);} return false; }

  async function run(){
    R.length=0;

    // --- чистые инварианты данных/SRS ---
    fresh("y9");
    ok("близнецы: keyOf(3,7)==keyOf(7,3)", keyOf(3,7)===keyOf(7,3));
    ensureFact(3,7);
    ok("открыт 3×7 → открыт и 7×3 (одна дверь)", !!S.facts[keyOf(7,3)]);
    ok("allFactKeys = 45 уникальных фактов", allFactKeys().length===45);

    (function(){
      const f=ensureFact(4,6); f.box=2; scheduleNext(f,true);
      const up=f.box; scheduleNext(f,false);
      ok("SRS: верно поднимает коробку, ошибка опускает", up===3 && f.box===2);
    })();

    (function(){
      const f=ensureFact(2,9); f.reps=1;
      f.last=Date.now()-1*3600e3; const p1=phaseFor(f);
      f.last=Date.now()-8*DAY;    const p2=phaseFor(f);
      ok("фаза по времени: свежее→Ритм(2), старое→Извлечение(4)", p1===2 && p2===4);
    })();

    ok("этап магии: 0 боссов→0", (S.bossDone={},magicStage())===0);
    S.bossDone={2:1,3:1,4:1,5:1,6:1}; ok("этап магии: 5 боссов→2", magicStage()===2);
    S.chaosDone=true; ok("этап магии: Хаос пал→4", magicStage()===4);
    S.bossDone={}; S.chaosDone=false;

    ok("гейтинг: ×3 заперта, пока ×2 не открыта", landUnlocked(3)===false);
    S.allLandsOpen=true; ok("гейтинг: allLandsOpen открывает всё", landUnlocked(7)===true);
    S.allLandsOpen=false;

    // --- движок вопроса ---
    (function(){ let r; askFact({a:6,b:7,onDone:(o,m,a)=>{r={o,a};}}); answer(42);
      return sleep(420).then(()=>ok("движок: верно с 1-й → ok=true", r.o===true && r.a===1)); })();
    await sleep(460);

    { let r; askFact({a:6,b:7,onDone:(o,m,a)=>{r={o,a};}});
      answer(40); const hint=document.getElementById("app").innerHTML.includes("hintbox");
      answer(42); await sleep(420);
      ok("движок: ошибся→верно → ok=false, была подсказка", r.o===false && r.a===2 && hint); }

    { let r; askFact({a:7,b:8,oneShot:true,noHint:true,onDone:o=>{r=o;}});
      answer(99); const reveal=document.getElementById("app").innerHTML.includes("Ответ:");
      await sleep(300);
      ok("один выстрел: неверно→false, ответ НЕ показан", r===false && !reveal); }

    // --- Испытание Мастера: таймаут ≠ знаниевая ошибка ---
    fresh("mast");
    { const f=ensureFact(7,8); f.reps=4; f.box=4; f.errors=0; f.due=Date.now()+5*DAY; f.last=Date.now();
      trial={qs:["7x8"],i:0,lives:3,ok:0,times:[],missed:[]};
      trialNext(); clearQuizTimer(); finishQuiz(false,4000,1,true);
      await sleep(300);
      ok("таймаут на знаемом факте не портит SRS/Уголок", f.errors===0 && f.box===4); }

    { const g=ensureFact(6,7); g.reps=4; g.box=4; g.errors=0; g.due=Date.now()+5*DAY; g.last=Date.now();
      trial={qs:["6x7"],i:0,lives:3,ok:0,times:[],missed:[]};
      trialNext(); answer(40); await sleep(300);
      ok("честно неверный ответ в Испытании кормит SRS", g.errors===1 && g.box===3); }

    fresh("mast");
    ensureFact(2,2).reps=1; ensureFact(2,3).reps=1; save();
    startTrial();
    ok("Испытание: <10 открытых врат — не запускается", trial===null && document.getElementById("app").textContent.includes("Ещё рано"));

    // --- Марафон ---
    fresh("y9");
    marathonRun(0); ok("Марафон: вся таблица = 45", marathon.qs.length===45);
    marathon=null; quizState=null; clearQuizTimer();

    // --- Босс: в режиме Мастера нет пощады ---
    fresh("mast");
    for(let m=2;m<=10;m++){const f=ensureFact(2,m); f.reps=3;}
    startBoss(2); bossNext(); await waitQuiz();
    { const before=boss.closed;
      answer(999); await waitQuiz(); answer(999); await sleep(300);
      ok("босс Мастера: 2 ошибки не «усталяют» (нет пощады)", boss.closed===before && boss.failed===2); }
    boss=null; quizState=null; clearQuizTimer();

    // --- Плейсмент: подтверждённая таблица открывается, карта разблокируется ---
    fresh(null); S.profile=null;
    startPlacement(); placeToggle(4); placeVerifyStart();
    for(let i=0;i<8;i++){ if(!(await waitQuiz(700))) break; const {a,b}=quizState.opts; answer(a*b); }
    await sleep(200);
    ok("плейсмент: ×4 открыта и карта свободна", S.facts[keyOf(4,8)]&&S.facts[keyOf(4,8)].reps>0 && S.allLandsOpen);

    // --- Игроки: изоляция и миграция ---
    (function(){
      try{ localStorage.clear(); }catch(e){}
      curPlayer=null; S=null;
      createPlayer("A","🦊"); S.sparks=11; save(); const aId=curPlayer.id;
      createPlayer("B","🐉"); S.sparks=22; save();
      selectPlayer(aId);
      ok("игроки: прогресс изолирован (A=11, не 22)", S.sparks===11);
    })();
    (function(){
      try{ localStorage.clear(); }catch(e){}
      curPlayer=null; S=null;
      localStorage.setItem("gates_save_v1", JSON.stringify({profile:"y9",sparks:77,introDone:true}));
      const reg=bootPlayers();
      const migrated = reg.players.length===1 && localStorage.getItem("gates_save_v1")===null;
      selectPlayer(reg.players[0].id);
      ok("миграция старого сейва: прогресс сохранён (sparks=77)", migrated && S.sparks===77);
    })();

    // очистка после тестов
    try{ localStorage.clear(); }catch(e){}
    curPlayer=null; S=null;

    const passed=R.filter(r=>r.pass).length, total=R.length;
    console.log(`%cСмоук: ${passed}/${total} пройдено`, "font-weight:bold;color:"+(passed===total?"green":"red"));
    R.forEach(r=>console.log((r.pass?"✅":"❌")+" "+r.name));
    return { passed, total, failed: R.filter(r=>!r.pass).map(r=>r.name) };
  }
  window.runSmoke = run;
})();
