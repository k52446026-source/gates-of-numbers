/* =====================================================================
   ЭКРАН ВОПРОСА (универсальный движок ввода ответа)
   opts: {a, b, phase, minimal, paper, context, onDone(ok, ms, attempts), headerHtml, hint}
   ===================================================================== */
let quizState=null, quizTimer=null;
function clearQuizTimer(){ if(quizTimer){ clearInterval(quizTimer); quizTimer=null; } }
function askFact(opts){
  quizState = {input:"", start:Date.now(), attempts:0, hinted:false, opts};
  drawQuiz();
}
/* обратный отсчёт для режима Мастера: истёк — ответ засчитан как неверный */
function startQuizTimer(sec){
  clearQuizTimer();
  const t0=Date.now();
  quizTimer=setInterval(()=>{
    if(!quizState){ clearQuizTimer(); return; }
    const frac=Math.max(0, 1 - (Date.now()-t0)/(sec*1000));
    const fill=document.getElementById("qtimerfill");
    if(fill) fill.style.width=(frac*100)+"%";
    if(frac<=0){ clearQuizTimer(); sndBad(); finishQuiz(false, sec*1000, quizState.attempts||1, true); }
  }, 80);
}
function finishQuiz(ok, ms, attempts, timedOut){
  clearQuizTimer();
  const st=quizState; quizState=null;
  setTimeout(()=>{
    if(!st.opts.paper) document.body.classList.remove("paper");
    st.opts.onDone(ok, ms, attempts, timedOut);
  }, ok?350:200);
}
function drawQuiz(hintText, wrong){
  const {a,b,phase,paper,headerHtml} = quizState.opts;
  const phaseNames={1:"Фаза 1 · Знакомство",2:"Фаза 2 · Ритм",3:"Фаза 3 · Действие",4:"Фаза 4 · Извлечение"};
  document.body.classList.toggle("paper", !!paper);
  render(`
    <div class="topbar">
      ${quizState.opts.onQuit?'<button class="btn small ghostb" onclick="quizQuit()">✕</button>':""}
      ${paper?'<span class="chip">📝 Как в тетради</span>':`<span class="chip">✨ ${S.sparks}</span>`}
      <span class="spacer"></span>
      ${quizState.opts.progress?`<span class="chip">${quizState.opts.progress}</span>`:""}
    </div>
    ${headerHtml||""}
    <div class="quiz-wrap">
      ${phase && !paper ? `<div class="phase-tag">${phaseNames[phase]||""}</div>`:""}
      <div class="equation ${paper?'plain':''} ${wrong?'shake':''}" id="eq">
        ${a} × ${b} = <span class="ans" id="ansbox">${quizState.input||"&nbsp;"}</span>
      </div>
      ${quizState.opts.timer?`<div class="qtimer noprint"><div id="qtimerfill"></div></div>`:""}
      ${hintText?`<div class="hintbox">💡 ${hintText}</div>`:""}
      <div class="numpad">
        ${[1,2,3,4,5,6,7,8,9].map(d=>`<button onclick="numTap(${d})">${d}</button>`).join("")}
        <button class="del" onclick="numDel()" aria-label="Стереть">⌫</button>
        <button onclick="numTap(0)">0</button>
        <button class="ok" onclick="numOk()" aria-label="Ответить">✓</button>
      </div>
    </div>
  `);
  if(quizState.opts.timer && !quizTimer) startQuizTimer(quizState.opts.timer);
}
window.numTap = d=>{
  if(!quizState) return;
  if(quizState.input.length>=3) return;
  quizState.input += d;
  document.getElementById("ansbox").textContent = quizState.input;
};
window.numDel = ()=>{
  if(!quizState) return;
  quizState.input = quizState.input.slice(0,-1);
  document.getElementById("ansbox").innerHTML = quizState.input||"&nbsp;";
};
window.numOk = ()=>{
  if(!quizState || quizState.input==="") return;
  const {a,b} = quizState.opts;
  const val=parseInt(quizState.input,10);
  quizState.attempts++;
  const ms=Date.now()-quizState.start;
  const correct = val===a*b;
  // Режим Мастера: один выстрел — ответ окончателен, без подсказки и показа ответа
  if(quizState.opts.oneShot){
    const eq=document.getElementById("eq");
    if(correct){ sndGood(); if(eq) eq.classList.add("pop"); }
    else { sndBad(); if(eq) eq.classList.add("shake"); }
    finishQuiz(correct, ms, quizState.attempts);
    return;
  }
  if(correct){
    sndGood();
    const eq=document.getElementById("eq"); if(eq) eq.classList.add("pop");
    finishQuiz(quizState.attempts===1, ms, quizState.attempts); // ok = верно с первой попытки
  }else{
    sndBad();
    quizState.input="";
    if(quizState.attempts===1 && !quizState.opts.noHint){
      drawQuiz(quizState.opts.hint || hintFor(a,b), true);
    }else if(quizState.attempts>=2){
      // после 2-й ошибки — показать ответ и попросить повторить его (achievable step)
      drawQuiz(`Ответ: <b>${a} × ${b} = ${a*b}</b>. Набери его — и врата это запомнят.`, true);
    }else{
      drawQuiz(null, true);
    }
  }
};
window.quizQuit = ()=>{
  if(!quizState) return;
  const quit=quizState.opts.onQuit;
  quizState=null;
  clearQuizTimer();
  document.body.classList.remove("paper");
  if(quit) quit();
};
document.addEventListener("keydown", e=>{
  if(quizState){
    if(e.key>="0" && e.key<="9") numTap(+e.key);
    else if(e.key==="Backspace") numDel();
    else if(e.key==="Enter"){ e.preventDefault(); numOk(); } // Enter = отправить, не «клик» по фокусу
    return;
  }
  // активация div-кнопок (врата, земли, плитки, лавка) с клавиатуры
  if((e.key==="Enter"||e.key===" ") && e.target && e.target.closest){
    const el=e.target.closest('[role="button"]');
    if(el){ e.preventDefault(); el.click(); }
  }
});

/* Сцена «Знакомство»: группы точек (dual coding, субитизация по 5) */
function dotsScene(a,b){
  let rows="";
  for(let i=0;i<a;i++){
    let grp="", dots="";
    for(let j=1;j<=b;j++){
      dots+=`<div class="dot"></div>`;
      if(j%5===0 || j===b){ grp+=`<div class="dotgrp">${dots}</div>`; dots=""; }
    }
    rows+=`<div class="dotrow">${grp}</div>`;
  }
  return `<div class="dots">${rows}</div>`;
}

