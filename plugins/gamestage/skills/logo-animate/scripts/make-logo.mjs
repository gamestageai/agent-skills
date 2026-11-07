#!/usr/bin/env node
// Makes an animated wordmark from a settings file.
//
//   node make-logo.mjs <settings.json> [--out <folder>] [--scale 2]
//
// Writes three files to the output folder (default: next to the settings file):
//   <name>.svg           animated, plays once, font built in, still for fans who prefer reduced motion
//   <name>.png           the finished logo as a transparent still image
//   <name>-preview.html  both on a dark background, with a Replay button
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPlaywright } from './lib/playwright.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (flag, fallback) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : fallback; };
const settingsPath = args.find((a, i) => !a.startsWith('--') && !['--out', '--scale'].includes(args[i - 1]));
if (!settingsPath) {
  console.error('Usage: node make-logo.mjs <settings.json> [--out <folder>] [--scale 2]');
  process.exit(1);
}

const DEFAULTS = {
  badge: 'ball',              // ball, moon or none
  frame: true,
  colour: '#ffffff',          // frame, letters, tab and badge
  tabInk: '#0b0b10',          // letters on the tab
  badgeInk: '#0b0b10',        // seams on the ball
  font: join(here, '../fonts/roboto-condensed-800.woff2'),
  fontFamily: 'Logo Display',
  fontWeight: 800,
  size: 240,
  tabSize: 84,
  tabSpacing: 12,
};
const settingsFile = resolve(settingsPath);
const raw = JSON.parse(readFileSync(settingsFile, 'utf8'));
const s = { ...DEFAULTS, ...raw };
if (raw.font) s.font = resolve(dirname(settingsFile), raw.font);
if (!s.name || !/^[a-z0-9-]+$/.test(s.name)) { console.error('Settings need a "name" in lower case with hyphens, such as "who-scored".'); process.exit(1); }
if (!s.line) { console.error('Settings need a "line": the main words, with * where the badge replaces a round letter, such as "KN*W?".'); process.exit(1); }
const out = resolve(opt('--out', dirname(settingsFile)));
const scale = Number(opt('--scale', 2));
mkdirSync(out, { recursive: true });

const fontData = readFileSync(s.font).toString('base64');
const fontFace = `@font-face { font-family: "${s.fontFamily}"; font-weight: ${s.fontWeight}; src: url(data:font/woff2;base64,${fontData}) format("woff2"); }`;

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: scale });
await page.goto(pathToFileURL(join(here, 'layout.html')).href);
await page.addStyleTag({ content: fontFace });
await page.evaluate(async (s) => { await document.fonts.load(`${s.fontWeight} 100px "${s.fontFamily}"`); }, s);
const size = await page.evaluate((s) => window.layout(s), s);
await page.locator('#mark').screenshot({ path: join(out, `${s.name}.png`), omitBackground: true });
const markup = await page.evaluate(() => {
  const svg = document.getElementById('mark').cloneNode(true);
  svg.removeAttribute('id');
  return svg.outerHTML;
});
await browser.close();

// The animation, by role. Total about 1.6 seconds, plays once.
//   frame: draws itself around the edge     tab: drops in from above
//   badge: spins in from small              word: rises into place
//   bite (moon only): slides across so the moon waxes into a crescent
const css = `${fontFace}
.frame { stroke-linecap: square; stroke-dasharray: 1; stroke-dashoffset: 1; animation: draw .7s cubic-bezier(.6,0,.2,1) .05s forwards; }
.tab { opacity: 0; transform: translateY(-30px); animation: up .4s cubic-bezier(.2,.8,.2,1) .3s forwards; }
.word { opacity: 0; transform: translateY(18px); animation: up .45s cubic-bezier(.2,.8,.2,1) .5s forwards; }
.badge { transform-box: fill-box; transform-origin: center; animation: spin 1s cubic-bezier(.2,.8,.2,1) .4s both; }
.moon { animation: fade .35s ease-out .35s both; }
.bite { transform-box: fill-box; transform-origin: center; transform: translate(150%, -30%); animation: phase .9s cubic-bezier(.3,0,.2,1) .55s forwards; }
@keyframes draw { to { stroke-dashoffset: 0; } }
@keyframes up { to { opacity: 1; transform: none; } }
@keyframes fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes spin { from { opacity: 0; transform: rotate(-200deg) scale(.4); } to { opacity: 1; transform: none; } }
@keyframes phase { to { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .frame, .tab, .word, .badge, .moon, .bite { animation: none; opacity: 1; transform: none; stroke-dashoffset: 0; }
}`;
const svg = markup.replace(/<svg([^>]*)>/, `<svg$1><style>${css}</style>`);
writeFileSync(join(out, `${s.name}.svg`), svg);

writeFileSync(join(out, `${s.name}-preview.html`), `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${s.name}</title>
<style>
  body { margin: 0; min-height: 100vh; display: grid; place-items: center; gap: 24px; background: ${s.background || '#0b0b10'}; font: 17px system-ui, sans-serif; color: #c9c9d4; }
  img { width: min(90vw, 720px); height: auto; }
  button { font: inherit; padding: 10px 20px; border-radius: 8px; border: 1px solid #ffffff40; background: transparent; color: #fff; cursor: pointer; }
</style></head>
<body><div style="display:grid;gap:24px;justify-items:center">
  <img id="logo" src="${s.name}.svg" alt="${(s.tab ? s.tab + ' ' : '') + s.line.replace('*', 'O')}">
  <button onclick="const i=document.getElementById('logo');i.src='${s.name}.svg?'+Date.now()">Replay</button>
</div></body></html>
`);

console.log(`${s.name}: ${Math.round(size.width)}x${Math.round(size.height)}, svg ${Math.round(svg.length / 1024)} KB, png at ${scale}x`);
console.log(`  ${join(out, s.name + '.svg')}`);
console.log(`  ${join(out, s.name + '.png')}`);
console.log(`  ${join(out, s.name + '-preview.html')}`);
