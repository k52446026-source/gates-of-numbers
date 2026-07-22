// Одноразовый разбор index.html на модули src/*.
// Режет <script> по секционным баннерам на НЕПРЕРЫВНЫЕ куски и раскладывает
// по модулям (порядок модулей = порядок секций), так что сборка обратно даёт
// побайтово тот же скрипт. CSS и оболочку выносит отдельно.
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,"$1"), "..");
const html = fs.readFileSync(path.join(ROOT,"index.html"),"utf8");

const styleOpen = html.indexOf("<style>")+7;
const styleClose = html.indexOf("</style>");
const scriptOpen = html.indexOf("<script>")+8;
const scriptClose = html.lastIndexOf("</script>");

const css = html.slice(styleOpen, styleClose);
const script = html.slice(scriptOpen, scriptClose);
// оболочка с плейсхолдерами
const shell = html.slice(0,styleOpen) + "/*__STYLES__*/" + html.slice(styleClose, scriptOpen)
            + "/*__SCRIPT__*/" + html.slice(scriptClose);

// --- найти начала секций ---
const lines = script.split("\n");
let offset = 0; const lineOffset = lines.map(l => { const o = offset; offset += l.length+1; return o; });
const starts = [];
for(let i=0;i<lines.length;i++){
  const l = lines[i];
  if(/^\/\*\s*={15,}\s*$/.test(l) || /^\/\*\s*-{4,}\s*.+-{4,}\s*\*\/\s*$/.test(l)){
    const title = /={15,}/.test(l) ? (lines[i+1]||"").trim() : l.replace(/^\/\*\s*-+\s*/,"").replace(/\s*-+\s*\*\/\s*$/,"").trim();
    starts.push({ off: lineOffset[i], title });
  }
}
// куски: [prefix before first banner] + [banner_i .. banner_{i+1})
const chunks = [];
if(starts[0].off>0) chunks.push({ title:"__prefix__", text: script.slice(0, starts[0].off) });
for(let i=0;i<starts.length;i++){
  const end = i+1<starts.length ? starts[i+1].off : script.length;
  chunks.push({ title: starts[i].title, text: script.slice(starts[i].off, end) });
}

// --- раскладка секций по модулям (непрерывные группы, порядок сохранён) ---
const MODULES = [
  ["00-data.js",        ["__prefix__","ХРАНИТЕЛИ","Данные мира"]],
  ["10-state.js",       ["Игроки","Состояние"]],
  ["20-core.js",        ["Утилиты","Звук","Числа словами"]],
  ["30-srs.js",         ["Факты и SRS","Подсказки-декомпозиции"]],
  ["40-engine.js",      ["ЭКРАН ВОПРОСА"]],
  ["50-onboarding.js",  ["ВСТУПЛЕНИЕ","ИСПЫТАНИЕ НА ЗНАНИЕ"]],
  ["60-map.js",         ["КАРТА МИРА"]],
  ["70-practice.js",    ["ОЧЕРЕДЬ ПОВТОРЕНИЙ","МАРАФОН","ИСПЫТАНИЕ МАСТЕРА"]],
  ["80-land.js",        ["ЗЕМЛЯ: врата"]],
  ["85-boss.js",        ["БОСС ЗЕМЛИ","БОЙ-МОЛНИЯ"]],
  ["88-challenges.js",  ["ПОРТАЛ ХАОСА","УГОЛОК ЗАБВЕНИЯ","РЕЖИМ","ФИНАЛЬНЫЙ БОСС"]],
  ["90-hub.js",         ["КУЗНИЦА","МАСТЕРСКАЯ","ЗАЛ СЛАВЫ","ПАНЕЛЬ МАГИСТРА"]],
  ["99-boot.js",        ["Старт"]],
];
const moduleOf = title => {
  for(const [file,keys] of MODULES) if(keys.some(k=>title.startsWith(k))) return file;
  throw new Error("Секция без модуля: "+title);
};

const srcDir = path.join(ROOT,"src");
fs.mkdirSync(srcDir,{recursive:true});
const buckets = new Map(MODULES.map(([f])=>[f,[]]));
for(const c of chunks) buckets.get(moduleOf(c.title)).push(c.text);

// проверка порядка: конкатенация всех модулей = исходный скрипт
let rebuilt = "";
for(const [file] of MODULES){ rebuilt += buckets.get(file).join(""); }
if(rebuilt !== script){ console.error("!! РАЗБОР НЕ ЛОССЛЕСС — порядок секций нарушен"); process.exit(1); }

for(const [file] of MODULES) fs.writeFileSync(path.join(srcDir,file), buckets.get(file).join(""));
fs.writeFileSync(path.join(srcDir,"styles.css"), css);
fs.writeFileSync(path.join(srcDir,"shell.html"), shell);
console.log("Разбор ок (лоссслесс). Модулей:", MODULES.length, "· секций:", chunks.length);
