#!/usr/bin/env node
// Scores a tracing against the image it was traced from.
//
//   node trace-check.mjs <source.png> <traced.svg> [--diff <diff.png>] [--box x,y,w,h]
//
// Draws the SVG over the image at the image's own pixel size and counts the pixels that agree on
// "ink" or "empty". Ink is any pixel that is not transparent and not the image's background colour
// (read from the top-left corner), so a logo on a solid background works as well as a transparent icon.
//
// Prints the overlap as a percentage. 95% or more is a good tracing; the rest is soft edges.
// --diff writes a picture of the differences: green agrees, red is in the image only (draw more
// there), blue is in the tracing only (draw less there).
// --box limits the check to one region, such as the icon on its own: --box 126,132,258,215.
//
// Draw the tracing in the image's pixel coordinates (viewBox="0 0 <width> <height>"); crop it after.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPlaywright, parseArgs } from './lib/playwright.mjs';

const { flags, rest } = parseArgs(process.argv.slice(2), ['diff', 'box']);
const [png, svg] = rest;
if (!png || !svg) { console.error('Usage: node trace-check.mjs <source.png> <traced.svg> [--diff diff.png] [--box x,y,w,h]'); process.exit(1); }
const box = flags.box ? flags.box.split(',').map(Number) : null;
if (box && (box.length !== 4 || box.some(isNaN))) { console.error('--box is four numbers: x,y,width,height.'); process.exit(1); }

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
const r = await page.evaluate(async ([a, b, box]) => {
  const load = async (src) => { const i = new Image(); i.src = src; await i.decode(); return i; };
  const A = await load(a), B = await load(b);
  const W = A.naturalWidth, H = A.naturalHeight;
  const pixels = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(img, 0, 0, W, H); return x.getImageData(0, 0, W, H).data; };
  const da = pixels(A), db = pixels(B);
  const bg = [da[0], da[1], da[2], da[3]];
  const inkA = (k) => da[k + 3] > 128 && (bg[3] < 128 || Math.abs(da[k] - bg[0]) + Math.abs(da[k + 1] - bg[1]) + Math.abs(da[k + 2] - bg[2]) > 60);
  const [bx, by, bw, bh] = box || [0, 0, W, H];
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); const o = x.createImageData(W, H);
  let both = 0, either = 0, onlyA = 0, onlyB = 0;
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    const k = (y * W + X) * 4, inside = X >= bx && X < bx + bw && y >= by && y < by + bh;
    const fa = inside && inkA(k), fb = inside && db[k + 3] > 128;
    if (fa || fb) either++; if (fa && fb) both++; if (fa && !fb) onlyA++; if (fb && !fa) onlyB++;
    o.data[k] = fa && !fb ? 255 : 0; o.data[k + 1] = fa && fb ? 140 : 0; o.data[k + 2] = fb && !fa ? 255 : 0; o.data[k + 3] = 255;
  }
  x.putImageData(o, 0, 0);
  return { W, H, overlap: either ? both / either : 0, onlyA, onlyB, diff: c.toDataURL() };
}, ['data:image/png;base64,' + readFileSync(resolve(png)).toString('base64'), 'data:image/svg+xml;base64,' + readFileSync(resolve(svg)).toString('base64'), box]);
await browser.close();

if (flags.diff) writeFileSync(resolve(flags.diff), Buffer.from(r.diff.split(',')[1], 'base64'));
const pct = (r.overlap * 100).toFixed(1);
console.log(`overlap ${pct}%  (${r.onlyA} px in the image only, ${r.onlyB} px in the tracing only, image ${r.W}x${r.H})`);
console.log(r.overlap >= 0.95 ? 'Good: what is left is soft edges.' : r.overlap >= 0.85 ? 'Close. Open the diff and move the red and blue edges.' : 'Far off. Check the tracing uses the image\'s pixel coordinates, then open the diff.');
if (flags.diff) console.log(`  ${resolve(flags.diff)}`);
process.exitCode = r.overlap >= 0.95 ? 0 : 2;
