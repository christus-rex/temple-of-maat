import fs from 'node:fs';

const file = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const installedMarker = '<script type="module">window.__templeDataReady.then(()=>{var _c=Object.create;';
if (html.includes(installedMarker)) process.exit(0);
const markers = [
  '<script type="module">var _c=Object.create;',
  '<script type="module">await window.__templeDataReady;var _c=Object.create;'
];
const marker = markers.find((candidate) => html.includes(candidate));
const render = '}kc.createRoot(document.getElementById("root")).render(c(Cc.default.StrictMode,{children:c(Vi,{})}));';

if (!marker || !html.includes(render)) {
  throw new Error('Temple module entry marker was not found');
}

fs.writeFileSync(
  file,
  html
    .replace(marker, installedMarker)
    .replace(render, `${render}});`)
);
