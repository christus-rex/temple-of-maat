import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const must=['index.html','manifest.webmanifest','sw.js','chambers.json','version.json','COPYRIGHT.md','assets/js/app.bundle.js','assets/js/runtime.js','assets/js/pwa-home.js','assets/css/site.css','assets/css/pwa-home.css'];
for(const f of must){if(!fs.existsSync(path.join(root,f)))throw new Error(`Missing required file: ${f}`);}
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
if(manifest.start_url!=='./'||manifest.scope!=='./')throw new Error('Manifest must retain GitHub Pages-safe ./ start_url and scope');
const data=JSON.parse(fs.readFileSync(path.join(root,'chambers.json'),'utf8'));
if(!Array.isArray(data.chambers)||data.chambers.length!==72)throw new Error(`Expected 72 chambers, found ${data.chambers?.length}`);
const ids=new Set();
for(const c of data.chambers){if(ids.has(c.id))throw new Error(`Duplicate chamber id ${c.id}`);ids.add(c.id);for(const key of ['heroImage','sealImage']){const rel=String(c[key]||'').replace(/^\.\//,'');if(!rel||!fs.existsSync(path.join(root,rel)))throw new Error(`Missing ${key} for chamber ${c.id}: ${c[key]}`);}}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
if(/data:image\/(?:png|webp);base64,/i.test(html))throw new Error('Embedded image data URIs remain in index.html');
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');if(!sw.includes('temple-maat-pwa-v6'))throw new Error('Service worker version is not v6');
console.log(`Validated ${data.chambers.length} chambers, ${ids.size} unique IDs, modular assets, manifest, and service worker.`);
