import fs from 'node:fs';

const htmlPath = 'index.html';
let html = fs.readFileSync(htmlPath, 'utf8');

function optimizeLoading(mode, expected) {
  const pattern = new RegExp(`loading:"${mode}"(?:,decoding:"async")*`, 'g');
  const count = [...html.matchAll(pattern)].length;
  if (count !== expected) throw new Error(`Expected ${expected} ${mode} image declarations, found ${count}`);
  html = html.replace(pattern, `loading:"${mode}",decoding:"async"`);
  return count;
}

function optimizeTemplate(from, to, expected) {
  const originalCount = html.split(from).length - 1;
  const optimizedCount = html.split(to).length - 1;
  if (originalCount === expected) {
    html = html.replaceAll(from, to);
    return expected;
  }
  if (originalCount === 0 && optimizedCount === expected) return 0;
  throw new Error(`Expected ${expected} image templates, found ${originalCount} original and ${optimizedCount} optimized`);
}

const lazyUpdated = optimizeLoading('lazy', 6);
const eagerUpdated = optimizeLoading('eager', 1);

const sealLoadingPattern = /(art\.appendChild\(img\); \}\r?\n)(\s*)if\(img\.src!==data\) img\.src=data;/;
const sealLoadingOptimized = "img.loading='lazy'; img.decoding='async';";
let sealUpdated = 0;
if (sealLoadingPattern.test(html)) {
  html = html.replace(sealLoadingPattern, `$1$2${sealLoadingOptimized}\n$2if(img.src!==data) img.src=data;`);
  sealUpdated = 1;
} else if (!html.includes(sealLoadingOptimized)) {
  throw new Error('Could not find the prebuilt seal image assignment');
}

const codexHeroUpdated = optimizeTemplate(
  '<img src="${escapeHtml(info.imgSrc)}" alt="${escapeHtml(info.name)}" />',
  '<img src="${escapeHtml(info.imgSrc)}" alt="${escapeHtml(info.name)}" loading="lazy" decoding="async" />',
  1
);
const librarySealUpdated = optimizeTemplate(
  '<img src="${escapeHtml(info.sealSrc)}" alt="Seal of ${escapeHtml(info.name)}" />',
  '<img src="${escapeHtml(info.sealSrc)}" alt="Seal of ${escapeHtml(info.name)}" loading="lazy" decoding="async" />',
  2
);

fs.writeFileSync(htmlPath, html);
console.log(`Optimized image loading: ${lazyUpdated} lazy React images, ${eagerUpdated} eager React image, ${sealUpdated} seal assignment, ${codexHeroUpdated} Codex hero template, ${librarySealUpdated} seal-library templates.`);
