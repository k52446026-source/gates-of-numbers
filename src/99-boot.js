/* ---------------- Старт ---------------- */
window.showTitle = showTitle;
(function boot(){
  const reg = bootPlayers();
  if(!reg.players.length){ showAddPlayer(true); return; }   // первый запуск — знакомимся
  showPlayerPick();                                          // «Кто играет?»
})();

/* PWA: офлайн и установка на планшет (GDD §17). Работает при запуске с http/https;
   открытие файла двойным кликом (file://) продолжает работать без установки. */
if("serviceWorker" in navigator && location.protocol.indexOf("http")===0 && !window.__NO_SW){
  addEventListener("load", ()=>{ navigator.serviceWorker.register("sw.js").catch(()=>{}); });
}
