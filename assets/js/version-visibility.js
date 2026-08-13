(function(){
  const FALLBACK={version:'6.1.4',build:'2026-08-13-pwa-v6.1.4-renderer-crash-hotfix',source:'Temple-of-Maat-PWA-GitHub-Pages-v6.1.4/index.html'};
  let info=FALLBACK;
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  async function loadVersion(){
    try{
      const r=await fetch('./version.json',{cache:'no-store'});
      if(r.ok){const j=await r.json(); if(j&&j.version) info={...FALLBACK,...j};}
    }catch(e){}
    render();
  }
  function ensureBadge(){
    let b=document.getElementById('temple-version-badge');
    if(!b){
      b=document.createElement('button'); b.id='temple-version-badge'; b.type='button'; b.setAttribute('aria-expanded','false'); b.setAttribute('aria-controls','temple-version-panel');
      b.addEventListener('click',()=>{const p=document.getElementById('temple-version-panel'); const open=!p.classList.contains('show'); p.classList.toggle('show',open); b.setAttribute('aria-expanded',String(open));});
      document.body.appendChild(b);
    }
    let p=document.getElementById('temple-version-panel');
    if(!p){
      p=document.createElement('div'); p.id='temple-version-panel'; p.setAttribute('role','status'); document.body.appendChild(p);
      document.addEventListener('click',ev=>{if(!p.classList.contains('show'))return; if(ev.target.closest('#temple-version-panel,#temple-version-badge'))return; p.classList.remove('show'); b.setAttribute('aria-expanded','false');});
    }
    return {b,p};
  }
  function updateAdminCard(){
    const card=document.querySelector('.temple-site-admin-card'); if(!card)return;
    let row=card.querySelector('.temple-site-admin-version');
    if(!row){row=document.createElement('div');row.className='temple-site-admin-version';card.appendChild(row);}
    row.textContent=`Temple v${info.version} • ${info.build}`;
  }
  function updateHome(){
    document.querySelectorAll('.tm-home-version').forEach(el=>el.textContent=`Temple v${info.version}`);
  }
  function updateConsole(){
    const header=document.querySelector('#tm-commit-deck .tm-commit-header'); if(!header)return;
    let tag=header.querySelector('.tm-console-version');
    if(!tag){tag=document.createElement('div');tag.className='tm-console-version';tag.style.cssText='margin-top:4px;font:700 9px/1.3 ui-monospace,monospace;letter-spacing:.11em;text-transform:uppercase;color:#90a9ab'; const heading=header.querySelector('.tm-commit-heading')||header; heading.appendChild(tag);}
    tag.textContent=`Temple v${info.version}`;
  }
  function render(){
    const {b,p}=ensureBadge();
    b.textContent=`Temple v${info.version}`;
    b.title=`Build ${info.build}`;
    p.innerHTML=`<strong>Temple of Ma’at v${esc(info.version)}</strong><div class="tv-label">Build</div><div class="tv-value">${esc(info.build)}</div><div class="tv-label">Source</div><div class="tv-value">${esc(info.source)}</div><div class="tv-label">Update check</div><div class="tv-value">version.json • network-first visibility</div>`;
    updateHome(); updateAdminCard(); updateConsole();
    document.documentElement.dataset.templeVersion=info.version;
    window.TempleVersion={...info};
  }
  function schedule(){render(); setTimeout(()=>{updateHome();updateAdminCard();updateConsole();},350);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{schedule();loadVersion();}); else {schedule();loadVersion();}
  const obs=new MutationObserver(()=>{updateHome();updateAdminCard();updateConsole();});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
