(()=>{
const banner=document.getElementById('install-banner'),button=document.getElementById('install-treasure'),guide=document.getElementById('install-guide'),close=document.getElementById('close-install-guide'),offline=document.getElementById('offline-status');let deferred=null;
const mode=window.matchMedia('(display-mode: standalone)'),sync=()=>{banner.hidden=mode.matches||window.navigator.standalone===true;offline.hidden=navigator.onLine;};
sync();window.addEventListener('online',sync);window.addEventListener('offline',sync);if(mode.addEventListener)mode.addEventListener('change',sync);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferred=event;});
window.addEventListener('appinstalled',()=>{deferred=null;banner.hidden=true;guide.close();});
button.addEventListener('click',async()=>{if(deferred){const prompt=deferred;deferred=null;try{await prompt.prompt();await prompt.userChoice;}catch(error){guide.showModal();}}else guide.showModal();});
close.addEventListener('click',()=>guide.close());guide.addEventListener('click',event=>{if(event.target===guide){const r=guide.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)guide.close();}});
if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js').catch(()=>{});});})();