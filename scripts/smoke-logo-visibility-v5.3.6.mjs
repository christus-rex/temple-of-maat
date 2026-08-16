import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'work', 'logo-visibility-v5.4');
fs.mkdirSync(outDir, { recursive: true });
const port = 41797;
const base = `http://127.0.0.1:${port}/`;
const priorNamespace = 'temple-maat-pwa-v5.2.7-logo-fixture';
const cacheRevision = 'v5.4-canonical-identity-r1';
const mime = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg','.opus':'audio/ogg','.wav':'audio/wav' };

const priorWorker = `const C='${priorNamespace}-static';self.addEventListener('install',e=>e.waitUntil((async()=>{const c=await caches.open(C);await c.addAll(['./','./index.html']);self.skipWaiting()})()));self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));self.addEventListener('message',e=>{if(e.data?.type==='SKIP_WAITING')self.skipWaiting()});`;

const server = http.createServer((req,res)=>{
  const url = new URL(req.url || '/', base);
  if (url.pathname === '/__prior-logo-sw.js') { res.writeHead(200, {'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store','Service-Worker-Allowed':'/'}); res.end(priorWorker); return; }
  if (url.pathname === '/__fixture.html') { res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}); res.end('<!doctype html><meta charset="utf-8"><title>fixture</title>'); return; }
  let pathname = decodeURIComponent(url.pathname); if (pathname === '/') pathname = '/index.html';
  const resolved = path.resolve(root, `.${pathname}`);
  if (!resolved.startsWith(root + path.sep) && resolved !== path.join(root,'index.html')) { res.writeHead(403); res.end(); return; }
  fs.stat(resolved,(err,stat)=>{ if(err||!stat.isFile()){res.writeHead(404);res.end();return;} res.writeHead(200,{'Content-Type':mime[path.extname(resolved).toLowerCase()]||'application/octet-stream','Cache-Control':'no-store'}); fs.createReadStream(resolved).pipe(res); });
});
await new Promise((resolve)=>server.listen(port,'127.0.0.1',resolve));

async function waitTemple(page){ await page.waitForFunction(()=>window.TempleLivingCodex?.records?.().length===72 && window.TemplePilgrimJourney?.state,{timeout:45000}); }

async function readLogo(page){
  return page.evaluate(async()=>{
    const panel=document.querySelector('.temple-static-entry__panel');
    const panelStyle=panel?getComputedStyle(panel,'::before'):null;
    const header=document.querySelector('.temple-brand-title');
    const headerStyle=header?getComputedStyle(header,'::before'):null;
    const response=await fetch('./assets/branding/temple-global-logo-v5.4.webp',{cache:'no-store'});
    let decoded=false,bytes=0;
    if(response.ok){const blob=await response.blob();bytes=blob.size;const u=URL.createObjectURL(blob);decoded=await new Promise(r=>{const i=new Image();i.onload=()=>r(i.naturalWidth>0&&i.naturalHeight>0);i.onerror=()=>r(false);i.src=u;});URL.revokeObjectURL(u);}
    return {ok:response.ok,decoded,bytes,panelBg:panelStyle?.backgroundImage||'',panelW:panelStyle?parseFloat(panelStyle.width):0,panelH:panelStyle?parseFloat(panelStyle.height):0,headerBg:headerStyle?.backgroundImage||'',docW:document.documentElement.scrollWidth,viewport:innerWidth};
  });
}

let browser;
try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1280,height:900}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(e.message));

  await page.goto(`${base}__fixture.html`,{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{const rs=await navigator.serviceWorker.getRegistrations();await Promise.all(rs.map(r=>r.unregister()));const ns=await caches.keys();await Promise.all(ns.map(n=>caches.delete(n)));await navigator.serviceWorker.register('./__prior-logo-sw.js',{scope:'./',updateViaCache:'none'});await navigator.serviceWorker.ready;});
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>navigator.serviceWorker.controller?.scriptURL.includes('__prior-logo-sw.js'),{timeout:30000});

  const upgrade=await page.evaluate(async({priorNamespace,cacheRevision})=>{
    const reg=await navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'});await reg.update();let c=reg.waiting||reg.installing;
    if(c&&c.state!=='activated'){if(!['installed','activated'].includes(c.state)){await new Promise((resolve,reject)=>{const t=setTimeout(()=>reject(new Error('install timeout')),90000);c.addEventListener('statechange',()=>{if(['installed','activated'].includes(c.state)){clearTimeout(t);resolve();}if(c.state==='redundant'){clearTimeout(t);reject(new Error('redundant'));}});});}c=reg.waiting||reg.installing;if(c&&c.state!=='activated'){const changed=new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));c.postMessage({type:'SKIP_WAITING'});await Promise.race([changed,new Promise((_,rej)=>setTimeout(()=>rej(new Error('controller timeout')),90000))]);}}
    const deadline=Date.now()+90000;let names=[];let active='';while(Date.now()<deadline){const r=await navigator.serviceWorker.getRegistration('./');names=await caches.keys();active=r?.active?.scriptURL||'';if(r?.active?.state==='activated'&&names.some(n=>n.includes(cacheRevision))&&!names.some(n=>n.includes(priorNamespace)))break;await new Promise(r=>setTimeout(r,100));}
    return {active,caches:names,revision:names.some(n=>n.includes(cacheRevision)),priorGone:!names.some(n=>n.includes(priorNamespace))};
  },{priorNamespace,cacheRevision});

  await page.evaluate(()=>localStorage.setItem('temple_last_chamber','42'));
  await page.goto(`${base}?logo=${Date.now()}#chamber-42`,{waitUntil:'domcontentloaded',timeout:120000});
  await waitTemple(page);
  const desktopBefore=await readLogo(page);
  const threshold=await page.evaluate(()=>({ready:document.body.classList.contains('temple-app-ready'),inert:document.getElementById('root')?.hasAttribute('inert'),hidden:document.getElementById('root')?.getAttribute('aria-hidden')==='true',continueText:document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim()}));
  await page.screenshot({path:path.join(outDir,'desktop-threshold.png')});
  await page.locator('[data-temple-entry="continue"]').click();
  await page.waitForFunction(()=>document.body.classList.contains('temple-app-ready'),{timeout:30000});
  const desktopAfter=await readLogo(page);
  await page.screenshot({path:path.join(outDir,'desktop-runtime.png')});
  await context.close();

  const mobile=[];
  for(const [width,height] of [[320,740],[360,800],[412,915]]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
    await ctx.addInitScript(()=>localStorage.setItem('temple_last_chamber','42'));
    const warm=await ctx.newPage();await warm.goto(`${base}?warm=${width}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:120000});if(await warm.evaluate(()=>'serviceWorker' in navigator))await warm.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await warm.close();
    const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`${base}?m=${width}-${Date.now()}#chamber-42`,{waitUntil:'domcontentloaded',timeout:120000});await waitTemple(p);await p.waitForTimeout(500);const logo=await readLogo(p);const held=await p.evaluate(()=>({ready:document.body.classList.contains('temple-app-ready'),continueText:document.querySelector('[data-temple-entry="continue"]')?.textContent?.trim()}));await p.screenshot({path:path.join(outDir,`mobile-${width}.png`)});mobile.push({width,logo,held,errors});await ctx.close();
  }

  const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
  const assertions={
    release:version.version==='5.4.0',
    cacheRotated:upgrade.active.endsWith('/sw.js')&&upgrade.revision&&upgrade.priorGone,
    thresholdHeld:!threshold.ready&&threshold.inert&&threshold.hidden&&threshold.continueText==='Continue at Chamber 42',
    desktopAsset:desktopBefore.ok&&desktopBefore.decoded&&desktopBefore.bytes>10000,
    desktopThresholdLogo:desktopBefore.panelW>100&&desktopBefore.panelH>100&&desktopBefore.panelBg.includes('temple-global-logo-v5.4.webp')&&desktopBefore.panelBg.includes('icon-512.png'),
    desktopRuntimeLogo:desktopAfter.headerBg.includes('temple-app-icon-192-v5.4.png')&&desktopAfter.headerBg.includes('icon-512.png'),
    mobileLogo:mobile.every(x=>x.logo.ok&&x.logo.decoded&&x.logo.panelW>100&&x.logo.panelBg.includes('temple-global-logo-v5.4.webp')&&x.logo.docW<=x.width+1),
    mobileThreshold:mobile.every(x=>!x.held.ready&&x.held.continueText==='Continue at Chamber 42'),
    noErrors:pageErrors.length===0&&mobile.every(x=>x.errors.length===0)
  };
  const failed=Object.entries(assertions).filter(([,v])=>!v).map(([k])=>k);const result={ok:failed.length===0,failed,assertions,version,upgrade,threshold,desktopBefore,desktopAfter,mobile,pageErrors};fs.writeFileSync(path.join(outDir,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;
}catch(error){fs.writeFileSync(path.join(outDir,'fatal-error.txt'),`${error?.stack||error}\n`);console.error(error);process.exitCode=1;}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));setTimeout(()=>process.exit(process.exitCode||0),50);}
