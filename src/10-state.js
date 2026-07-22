/* ---------------- Игроки (профили детей) ---------------- */
const SAVE_PREFIX = "gates_save_v1";   // сейв на каждого ребёнка: SAVE_PREFIX + "__" + id
const REG_KEY = "gates_players";       // реестр: {players:[{id,name,emoji}], current}
const PLAYER_EMOJI = ["🦊","🐯","🐼","🦄","🐉","🦉","🐬","🐢","🦖","🦁","🐸","🐵","🦕","🐺","🦋","⚡","🌟","🗝️"];
let curPlayer = null;
const playerKey = id => SAVE_PREFIX + "__" + id;
function loadRegistry(){ try{ return JSON.parse(localStorage.getItem(REG_KEY)) || {players:[],current:null}; }catch(e){ return {players:[],current:null}; } }
function saveRegistry(r){ try{ localStorage.setItem(REG_KEY, JSON.stringify(r)); }catch(e){} }

/* ---------------- Состояние ---------------- */
let S = null;

function defaultState(){
  return {
    ver:1,
    profile:null,          // ключ из PROFILES
    introDone:false,
    facts:{},              // "3x7": {reps, box, due, last, errors, streak, slowCnt}
    bossDone:{},           // n -> true
    blitzDone:{},          // n -> лучший счёт молний в реванше
    chaosDone:false,
    allLandsOpen:false,   // включается после «Испытания на знание» — карта свободна
    trialBest:0,          // лучший ранг «Испытания Мастера»: 1 бронза, 2 серебро, 3 золото
    sparks:0,
    shards:[],             // индексы LORE (могут повторяться -> фрагменты фрески)
    frescoCells:[],        // открытые клетки 0..99
    artifacts:[],
    items:[],              // купленное в кузнице
    tricksShown:{},        // n -> true (трюк уже выдан)
    landErrors:{},         // n -> счётчик ошибок в земле (для just-in-time трюков)
    noMagicResults:[],     // {ts, correct, total}
    diploma:false,
    settings:{sound:true, voice:false, static:false, calm:false, srsMult:1.0, portalMax:null},
    portalsThisSession:0, sessionDay:null, newToday:0,
    streak:{days:0, last:null},
    stats:{answers:0, correct:0},
  };
}
function save(){ if(!curPlayer) return; try{ localStorage.setItem(playerKey(curPlayer.id), JSON.stringify(S)); }catch(e){} }
function load(){
  try{
    const raw = curPlayer ? localStorage.getItem(playerKey(curPlayer.id)) : null;
    if(raw){
      const p = JSON.parse(raw);
      S = defaultState();
      // вложенные ветки сливаем глубоко: новые ключи по умолчанию переживают старый сейв
      for(const k of Object.keys(p)){
        if((k==="settings"||k==="stats"||k==="streak") && p[k] && typeof p[k]==="object") Object.assign(S[k], p[k]);
        else S[k]=p[k];
      }
      S.ver=1;
      return;
    }
  }catch(e){}
  S = defaultState();
}

/* Реестр игроков: миграция старого единого сейва, создание, выбор, удаление */
function bootPlayers(){
  const reg = loadRegistry();
  // одноразовая миграция сейва старого формата (единый ключ) в первого игрока
  if(!reg.players.length && localStorage.getItem(SAVE_PREFIX)){
    const id = "p"+Date.now();
    try{ localStorage.setItem(playerKey(id), localStorage.getItem(SAVE_PREFIX)); localStorage.removeItem(SAVE_PREFIX); }catch(e){}
    reg.players.push({id, name:"Хранитель", emoji:"🧙"});
    reg.current = id;
    saveRegistry(reg);
  }
  return reg;
}
function newPlayerId(){ return "p"+Date.now()+Math.floor(Math.random()*1000); }
window.selectPlayer = id=>{
  const reg = loadRegistry();
  const p = reg.players.find(x=>x.id===id);
  if(!p) return showPlayerPick();
  curPlayer = p; reg.current = id; saveRegistry(reg);
  load(); applyBodyModes(); document.body.classList.remove("paper");
  showTitle();
};
function createPlayer(name, emoji){
  const reg = loadRegistry();
  const id = newPlayerId();
  const p = {id, name:(name||"Хранитель").slice(0,16), emoji:emoji||"🦊"};
  reg.players.push(p); reg.current = id; saveRegistry(reg);
  curPlayer = p; S = defaultState(); save();
  applyBodyModes(); document.body.classList.remove("paper");
  showTitle();
}
window.deletePlayer = id=>{
  const reg = loadRegistry();
  reg.players = reg.players.filter(x=>x.id!==id);
  if(reg.current===id) reg.current = reg.players[0] ? reg.players[0].id : null;
  saveRegistry(reg);
  try{ localStorage.removeItem(playerKey(id)); }catch(e){}
  if(curPlayer && curPlayer.id===id) curPlayer = null;
};

