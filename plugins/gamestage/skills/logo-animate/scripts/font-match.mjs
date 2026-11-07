#!/usr/bin/env node
// Finds which Google Font a logo's words are set in, and where each letter sits.
//
//   node font-match.mjs <logo.png> --text "Quizbox" --box 450,157,681,164
//                       [--fonts "DM Sans,Figtree,Inter"] [--weights 400,450,500] [--save fit.json]
//
// --box is the rectangle the words fill in the image, from the top of the capitals to the baseline
// (leave out descenders). Read it off the image, or from trace-check's diff.
// For each font and weight it sizes the words to the box, then moves each letter to fit the image,
// and scores the overlap. Prints the best few. --save writes the winner: font, weight, size and the
// x position of every letter, ready to write as <text> elements in the tracing.
//
// A score near 90% or more with letters fitted is very likely the font. Around 70% is a lookalike:
// say so, and ask for the real font or the logo as SVG.
// Needs the network, to load the fonts from Google Fonts. Static fonts such as Poppins come only in
// whole hundreds, so a weight like 450 is tried only on variable fonts.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadPlaywright, parseArgs } from './lib/playwright.mjs';

const { flags, rest } = parseArgs(process.argv.slice(2), ['text', 'box', 'fonts', 'weights', 'save']);
const png = rest[0];
if (!png || !flags.text || !flags.box) { console.error('Usage: node font-match.mjs <logo.png> --text "Quizbox" --box x,y,w,h [--fonts "A,B"] [--weights 400,500] [--save fit.json]'); process.exit(1); }
const box = flags.box.split(',').map(Number);
if (box.length !== 4 || box.some(isNaN)) { console.error('--box is four numbers: x,y,width,height.'); process.exit(1); }
// A spread of the sans serifs logos are most often set in. Pass --fonts to try others.
const fonts = (flags.fonts || 'DM Sans,Figtree,Inter,Manrope,Plus Jakarta Sans,Albert Sans,Poppins,Montserrat,Outfit,Urbanist,Mulish,Nunito Sans,Work Sans,Roboto,Open Sans,Lato').split(',').map((f) => f.trim());
const weights = (flags.weights || '300,400,450,500,600,700').split(',').map(Number);

// Ask Google Fonts for each family at each weight separately. One request for everything drops any
// family whose weights don't cover the whole request, silently, so a static font such as Poppins
// would never be tried.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const offered = {}, sheets = []; let reached = false;
await Promise.all(fonts.flatMap((f) => weights.map(async (w) => {
  try {
    const r = await fetch(`https://fonts.googleapis.com/css2?family=${f.replace(/ /g, '+')}:wght@${w}&text=${encodeURIComponent(flags.text)}&display=block`, { headers: { 'User-Agent': UA } });
    reached = true;
    if (!r.ok) return;
    sheets.push(await r.text());
    (offered[f] ||= []).push(w);
  } catch {}
})));
if (!reached) { console.error('Could not reach fonts.googleapis.com. font-match needs the network.'); process.exit(1); }

const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<style>${sheets.join('\n')}</style>`);
const pairs = fonts.flatMap((f) => (offered[f] || []).sort((a, b) => a - b).map((w) => [f, w]));
const results = await page.evaluate(async ([src, pairs, box, text]) => {
  const loaded = [];
  for (const [f, w] of pairs) { await document.fonts.load(`${w} 100px "${f}"`, text); if (document.fonts.check(`${w} 100px "${f}"`, text)) loaded.push([f, w]); }
  const i = new Image(); i.src = src; await i.decode();
  const W = i.naturalWidth, H = i.naturalHeight;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, W, H).data;
  const bg = [d[0], d[1], d[2], d[3]];
  const [bx, by, bw, bh] = box, pad = 30;
  const T = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) {
    if (X < bx - pad || X > bx + bw + pad || y < by - pad || y > by + bh + pad) continue;
    const k = (y * W + X) * 4;
    T[y * W + X] = d[k + 3] > 128 && (bg[3] < 128 || Math.abs(d[k] - bg[0]) + Math.abs(d[k + 1] - bg[1]) + Math.abs(d[k + 2] - bg[2]) > 60) ? 1 : 0;
  }
  const letters = [...text];
  const render = (f, wt, fs, xs, dy) => {
    const c2 = document.createElement('canvas'); c2.width = W; c2.height = H; const y = c2.getContext('2d');
    y.font = `${wt} ${fs}px "${f}"`; y.fillStyle = '#fff';
    letters.forEach((ch, j) => y.fillText(ch, xs[j], by + bh + dy));
    const e = y.getImageData(0, 0, W, H).data; let both = 0, either = 0;
    for (let k = 0; k < W * H; k++) { const a = T[k], b = e[k * 4 + 3] > 128; if (a || b) either++; if (a && b) both++; }
    return either ? both / either : 0;
  };
  const out = [];
  for (const [f, wt] of loaded) {
    const m = document.createElement('canvas').getContext('2d');
    m.font = `${wt} 200px "${f}"`;
    const tallest = Math.max(...letters.map((ch) => m.measureText(ch).actualBoundingBoxAscent));
    let fs = 200 * bh / tallest; m.font = `${wt} ${fs}px "${f}"`;
    const total = m.measureText(text).width, ls = (bw - total) / Math.max(1, letters.length - 1);
    let xs = [], cx = bx + m.measureText(letters[0]).actualBoundingBoxLeft;
    for (const ch of letters) { xs.push(cx); cx += m.measureText(ch).width + ls; }
    out.push({ font: f, weight: wt, size: fs, xs, dy: 0, score: render(f, wt, fs, xs, 0) });
  }
  // Fit letter by letter only for the most promising, since it is the slow part.
  out.sort((a, b) => b.score - a.score);
  for (const r of out.slice(0, 6)) {
    for (let round = 0; round < 4; round++) {
      for (let j = 0; j < letters.length; j++) for (const dd of [-6, -3, -1, 1, 3, 6]) { const t = r.xs.slice(); t[j] += dd; const s = render(r.font, r.weight, r.size, t, r.dy); if (s > r.score) { r.score = s; r.xs = t; } }
      for (const df of [-4, -2, -1, 1, 2, 4]) { const s = render(r.font, r.weight, r.size + df, r.xs, r.dy); if (s > r.score) { r.score = s; r.size += df; } }
      for (const d2 of [-2, -1, 1, 2]) { const s = render(r.font, r.weight, r.size, r.xs, r.dy + d2); if (s > r.score) { r.score = s; r.dy += d2; } }
    }
    r.fitted = true;
  }
  out.sort((a, b) => b.score - a.score);
  return { loaded, out: out.slice(0, 6) };
}, ['data:image/png;base64,' + readFileSync(resolve(png)).toString('base64'), pairs, box, flags.text]);
await browser.close();

if (!results.loaded.length) { console.error('None of the fonts loaded at the weights asked for. Try --weights 400,700, or other --fonts.'); process.exit(1); }
const absent = fonts.filter((f) => !offered[f]);
if (absent.length) console.warn(`Not on Google Fonts at weights ${weights.join(', ')}, skipped: ${absent.join(', ')}`);
const partial = fonts.filter((f) => offered[f] && offered[f].length < weights.length);
if (partial.length) console.log(`Tried only the weights these offer: ${partial.map((f) => `${f} (${offered[f].sort((a, b) => a - b).join(', ')})`).join('; ')}`);
for (const r of results.out) console.log(`${(r.score * 100).toFixed(1).padStart(5)}%  ${r.font} ${r.weight}${r.fitted ? ', letters fitted' : ''}  size ${r.size.toFixed(1)}`);
const best = results.out[0];
console.log(best.score >= 0.85 ? `Very likely ${best.font} ${best.weight}.` : `Closest is ${best.font} ${best.weight}, but it is a lookalike. Ask for the real font or the logo as SVG.`);
if (flags.save) {
  writeFileSync(resolve(flags.save), JSON.stringify({ font: best.font, weight: best.weight, size: +best.size.toFixed(1), baseline: box[1] + box[3] + best.dy, letters: [...flags.text].map((ch, j) => ({ ch, x: +best.xs[j].toFixed(1) })), score: +best.score.toFixed(3) }, null, 2));
  console.log(`  ${resolve(flags.save)}`);
  console.log(`To build the font into the SVG with only these letters: curl -A "Mozilla/5.0 Chrome/130" "https://fonts.googleapis.com/css2?family=${best.font.replace(/ /g, '+')}:wght@${best.weight}&text=${encodeURIComponent(flags.text)}", then download the woff2 URL it names.`);
}
