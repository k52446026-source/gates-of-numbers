/* ---------------- Утилиты ---------------- */
const app = document.getElementById("app");
function render(html){ app.innerHTML = html; app.firstElementChild && app.firstElementChild.classList.add("fade-in"); window.scrollTo(0,0); }
function esc(s){ return String(s).replace(/[&<>"'\/]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","/":"&#47;"}[c])); }
function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function toast(msg, ms=2200){
  document.querySelectorAll(".toast").forEach(x=>x.remove());
  const t=document.createElement("div"); t.className="toast"; t.innerHTML=msg;
  t.setAttribute("role","status"); t.setAttribute("aria-live","polite");
  document.body.appendChild(t); setTimeout(()=>t.remove(), ms);
}
function fireworks(n=14, force){
  if(prof().static || S.settings.static) return;
  if(!force){ // «отмена магии» глушит только фоновые салюты; force — для явных побед
    const st=magicStage();
    if(st>=3) return;            // магия — фон: без салютов
    if(st>=1) n=Math.ceil(n/2);  // магия упрощается: салюты скромнее
  }
  const box=document.createElement("div"); box.className="fireworks";
  for(let i=0;i<n;i++){
    const s=document.createElement("div"); s.className="sparkfly"; s.textContent=rnd(["✨","⭐","💫"]);
    s.style.left="50%"; s.style.top="50%";
    s.style.setProperty("--dx",(Math.random()*400-200)+"px");
    s.style.setProperty("--dy",(Math.random()*400-200)+"px");
    box.appendChild(s);
  }
  document.body.appendChild(box); setTimeout(()=>box.remove(),1500);
}
function prof(){ return PROFILES[S.profile || "y7"]; }
/* Постепенная «отмена магии» — GDD §9. Прокси недель — победы над боссами:
   0 (0–2 босса) полная магия · 1 (3–4) магия упрощается · 2 (5–7) магия тает ·
   3 (8) магия — фон · 4 (Хаос пал) мир без магии */
const MAGIC_STAGES=["Полная магия","Магия упрощается","Магия тает","Магия — фон","Мир без магии"];
function magicStage(){
  if(S.chaosDone) return 4;
  const b=Object.keys(S.bossDone).length;
  return b>=8 ? 3 : b>=5 ? 2 : b>=3 ? 1 : 0;
}
function applyBodyModes(){
  const st=magicStage();
  document.body.classList.toggle("static-mode", !!(prof().static || S.settings.static));
  document.body.classList.toggle("subitize", !!prof().subitize);
  document.body.classList.toggle("magic-soft", st>=2);
  document.body.classList.toggle("magic-min", st>=3);
  document.body.classList.toggle("day", st>=4);
}

/* ---------------- Звук ---------------- */
let AC=null;
function beep(freqs, dur=0.12, type="sine", gain=0.08){
  if(!S.settings.sound) return;
  try{
    AC = AC || new (window.AudioContext||window.webkitAudioContext)();
    freqs.forEach((f,i)=>{
      const o=AC.createOscillator(), g=AC.createGain();
      o.type=type; o.frequency.value=f;
      g.gain.setValueAtTime(gain, AC.currentTime + i*dur);
      g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + i*dur + dur);
      o.connect(g); g.connect(AC.destination);
      o.start(AC.currentTime + i*dur); o.stop(AC.currentTime + i*dur + dur);
    });
  }catch(e){}
}
const sndGood = ()=>beep([523,659,784], 0.11);
const sndBad  = ()=>beep([220,196], 0.16, "triangle", 0.05);
const sndWin  = ()=>beep([523,659,784,1047,784,1047], 0.1);
function speak(text){
  if(!S.settings.voice) return;
  try{
    const u=new SpeechSynthesisUtterance(text); u.lang="ru-RU"; u.rate=0.92;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){}
}

/* ---------------- Числа словами (для мантр) ---------------- */
const UNITS=["ноль","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const TEENS=["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const TENS=["","десять","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
function numWords(n){
  if(n<10) return UNITS[n];
  if(n<20) return TEENS[n-10];
  if(n===100) return "сто";
  const t=Math.floor(n/10), u=n%10;
  return TENS[t] + (u? " "+UNITS[u] : "");
}
const MULT_ADV={1:"один раз",2:"дважды",3:"трижды",4:"четырежды",5:"пятью",6:"шестью",7:"семью",8:"восемью",9:"девятью",10:"десятью"};
function mantra(a,b){ return `${MULT_ADV[a]||a} ${numWords(b)} — ${numWords(a*b)}`; }

