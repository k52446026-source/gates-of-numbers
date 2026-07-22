// Сборка единого index.html из src/*  (артефакт и file:// требуют одного файла).
// Также кладёт урезанную версию в dist/game.html для публикации артефактом.
// Запуск:  node build.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/,"$1"));
const SRC = path.join(ROOT,"src");

// порядок модулей = порядок в игре (см. tools/split.mjs)
const ORDER = ["00-data.js","10-state.js","20-core.js","30-srs.js","40-engine.js",
  "50-onboarding.js","60-map.js","70-practice.js","80-land.js","85-boss.js",
  "88-challenges.js","90-hub.js","99-boot.js"];

const shell = fs.readFileSync(path.join(SRC,"shell.html"),"utf8");
const css   = fs.readFileSync(path.join(SRC,"styles.css"),"utf8");
const js    = ORDER.map(f=>fs.readFileSync(path.join(SRC,f),"utf8")).join("");

// функция-замена, иначе $-последовательности в css/js исказят вывод
const html = shell.replace("/*__STYLES__*/", ()=>css).replace("/*__SCRIPT__*/", ()=>js);
fs.writeFileSync(path.join(ROOT,"index.html"), html);

// урезанная версия для артефакта: снять внешнюю обёртку и PWA-регистрацию
let body = html.slice(html.indexOf("<style>"), html.lastIndexOf("</script>")+"</script>".length);
body = body.replace(/<\/style>\s*<\/head>\s*<body>/,"</style>");
body = body.replace(/\/\* PWA:[\s\S]*?\n}\n/,"");
fs.mkdirSync(path.join(ROOT,"dist"),{recursive:true});
fs.writeFileSync(path.join(ROOT,"dist","game.html"), body);
// та же конкатенация JS, что и в index.html — для смоук-тестов (строгий режим, как в проде)
fs.writeFileSync(path.join(ROOT,"dist","bundle.js"), js);

const kb = s => (Buffer.byteLength(s) / 1024).toFixed(1) + " КБ";
console.log("Собрано: index.html ("+kb(html)+") · dist/game.html ("+kb(body)+") · dist/bundle.js · модулей:", ORDER.length);
