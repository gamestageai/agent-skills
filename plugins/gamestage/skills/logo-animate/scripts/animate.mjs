#!/usr/bin/env node
// Animates any SVG whose parts are tagged with a role.
//
//   node animate.mjs <mark.svg> [--out <folder>] [--name <name>] [--modes once,loop,component]
//                    [--style playful|calm] [--tag <element-name>] [--label <words>] [--spin <seconds>]
//                    [--font <file.woff2>] [--font-family <name>] [--font-weight <n>]
//
// Tag parts in the SVG with data attributes (see SKILL.md for the full list):
//   data-enter="pop|fade|rise|drop|slide|grow|draw|open|spin-in|letters"   how the part arrives (once)
//   data-step="2"            arrival order; parts with the same step arrive together (default: document order)
//   data-from="left|right|top|bottom"   which way a slide comes in from
//   data-loop="bob|look|blink|wiggle|pulse|sway"   what the part does while looping or busy
//   data-spin=""             on the group that turns a full circle now and then (loop and component)
//   data-blink=""            on a part with data-enter="open": blink once after everything has arrived
//   data-origin="x y"        pivot in the SVG's own units (default: the part's centre)
//   data-reverse=""          run the loop half a beat later, so the second of a pair alternates (ears, arms)
//
// Writes to the output folder:
//   <name>.svg            plays once, then stays still        (mode once, the default)
//   <name>-loop.svg       loops while on screen, for loading  (mode loop)
//   <name>.js             a web component: still until busy   (mode component)
//   <name>-still.svg      no animation
//   <name>-preview.html   every output on light and dark, with Replay and Busy buttons
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { basename, dirname, extname, resolve, join } from 'node:path';
import { loadPlaywright, parseArgs } from './lib/playwright.mjs';

const { flags, rest } = parseArgs(process.argv.slice(2), ['out', 'name', 'modes', 'style', 'tag', 'label', 'spin', 'font', 'font-family', 'font-weight']);
const input = rest[0];
if (!input) {
  console.error('Usage: node animate.mjs <mark.svg> [--out <folder>] [--modes once,loop,component] [--style playful|calm]');
  process.exit(1);
}
const file = resolve(input);
const name = flags.name || basename(file, extname(file));
if (!/^[a-z0-9-]+$/.test(name)) { console.error(`The name "${name}" needs to be lower case with hyphens, such as "quizbox". Pass --name.`); process.exit(1); }
const modes = (flags.modes || 'once').split(',').map((m) => m.trim()).flatMap((m) => (m === 'all' ? ['once', 'loop', 'component'] : [m]));
for (const m of modes) if (!['once', 'loop', 'component'].includes(m)) { console.error(`Unknown mode "${m}". Use once, loop, component or all.`); process.exit(1); }
const style = flags.style || 'calm';
if (!['playful', 'calm'].includes(style)) { console.error('--style is playful or calm.'); process.exit(1); }
const tag = flags.tag || `${name}-mark`;
if (!/^[a-z][a-z0-9]*-[a-z0-9-]+$/.test(tag)) { console.error(`--tag "${tag}" needs a hyphen, such as "quiz-box", because web component names must have one.`); process.exit(1); }
const label = flags.label || name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const spinEvery = Number(flags.spin ?? 4);
const out = resolve(flags.out || dirname(file));
mkdirSync(out, { recursive: true });

let source = readFileSync(file, 'utf8');

// ---- Read the parts in a browser, so the SVG is parsed properly rather than by pattern. ----
const { chromium } = loadPlaywright();
const browser = await chromium.launch();
const page = await browser.newPage();
const parsed = await page.evaluate((src) => {
  const doc = new DOMParser().parseFromString(src, 'image/svg+xml');
  const svg = doc.documentElement;
  const perr = doc.querySelector('parsererror');
  if (perr) return { error: 'The file is not valid SVG: ' + perr.textContent.trim().split('\n').slice(0, 2).join(' ') + '\nAn attribute needs a value in SVG: write data-spin="" rather than data-spin.' };
  if (svg.nodeName !== 'svg') return { error: 'The file is not an SVG: its first element is <' + svg.nodeName + '>.' };
  const vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  if (vb.length !== 4 || vb.some(isNaN)) return { error: 'The SVG needs a viewBox, such as viewBox="0 0 252 218", so the motion can be sized to it.' };
  const tagged = '[data-enter],[data-loop],[data-spin]';
  // A CSS animation replaces a transform attribute, so a tagged part that has one is wrapped in a group
  // that carries the animation, and keeps its own transform.
  for (const el of [...svg.querySelectorAll(tagged)]) {
    if (!el.hasAttribute('transform')) continue;
    const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (const a of [...el.attributes]) if (a.name.startsWith('data-')) { g.setAttribute(a.name, a.value); el.removeAttribute(a.name); }
    el.parentNode.insertBefore(g, el); g.appendChild(el);
  }
  const roles = { enter: new Set(), loop: new Set() };
  const problems = [];
  const ENTER = ['pop', 'fade', 'rise', 'drop', 'slide', 'grow', 'draw', 'open', 'spin-in', 'letters'];
  const LOOP = ['bob', 'look', 'blink', 'wiggle', 'pulse', 'sway'];
  const origin = (el) => {
    const o = el.getAttribute('data-origin');
    if (o && /^-?[\d.]+\s+-?[\d.]+$/.test(o.trim())) { const [x, y] = o.trim().split(/\s+/); return `transform-box:view-box;transform-origin:${x}px ${y}px`; }
    return `transform-box:fill-box;transform-origin:${o || 'center'}`;
  };
  const addStyle = (el, s) => el.setAttribute('style', ((el.getAttribute('style') || '') + ';' + s).replace(/^;/, ''));
  // Steps: explicit data-step wins; the rest follow in document order after the highest so far.
  let next = 0, lastStep = 0;
  for (const el of svg.querySelectorAll('[data-enter]')) {
    const role = el.getAttribute('data-enter');
    if (!ENTER.includes(role)) { problems.push(`data-enter="${role}" is not a role. Use one of: ${ENTER.join(', ')}.`); continue; }
    const rawStep = el.getAttribute('data-step');
    if (rawStep !== null && !/^\d+$/.test(rawStep.trim())) { problems.push(`data-step="${rawStep}" needs to be a whole number, such as data-step="2".`); continue; }
    const step = rawStep !== null ? Number(rawStep) : next;
    next = Math.max(next, step + 1); lastStep = Math.max(lastStep, step);
    roles.enter.add(role);
    if (role === 'letters') {
      [...el.children].forEach((c, i) => { c.classList.add('a-in-rise'); addStyle(c, `--step:${step};--i:${i};transform-box:fill-box;transform-origin:center`); });
      continue;
    }
    el.classList.add('a-in-' + role);
    addStyle(el, `--step:${step};${origin(el)}`);
    if (role === 'slide') {
      const from = el.getAttribute('data-from') || 'left', d = 0.1 * vb[2];
      const [dx, dy] = { left: [-d, 0], right: [d, 0], top: [0, -d], bottom: [0, d] }[from] || [-d, 0];
      addStyle(el, `--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px`);
    }
    if (role === 'draw') for (const g of [el, ...el.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon')]) if (g.nodeName !== 'g') g.setAttribute('pathLength', '1');
    if (role === 'open' && el.hasAttribute('data-blink')) el.classList.add('a-blink-after');
  }
  for (const el of svg.querySelectorAll('[data-loop]')) {
    const role = el.getAttribute('data-loop');
    if (!LOOP.includes(role)) { problems.push(`data-loop="${role}" is not a role. Use one of: ${LOOP.join(', ')}.`); continue; }
    if (el.hasAttribute('data-enter')) {
      // One element, one animation: give it a wrapper for the loop so both can run in their own modes.
      const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
      el.parentNode.insertBefore(g, el); g.appendChild(el);
      g.setAttribute('data-loop', role); if (el.hasAttribute('data-reverse')) g.setAttribute('data-reverse', '');
      if (el.hasAttribute('data-origin')) g.setAttribute('data-origin', el.getAttribute('data-origin'));
      el.removeAttribute('data-loop');
      g.classList.add('a-loop-' + role); if (g.hasAttribute('data-reverse')) g.classList.add('a-reverse');
      addStyle(g, origin(g));
    } else {
      el.classList.add('a-loop-' + role); if (el.hasAttribute('data-reverse')) el.classList.add('a-reverse');
      if (!el.hasAttribute('data-enter')) addStyle(el, origin(el));
    }
    roles.loop.add(role);
  }
  const spinEl = svg.querySelector('[data-spin]');
  if (spinEl) { spinEl.classList.add('a-spin'); if (!spinEl.hasAttribute('data-enter')) addStyle(spinEl, origin(spinEl)); }
  for (const el of [svg, ...svg.querySelectorAll('*')]) for (const a of [...el.attributes]) if (a.name.startsWith('data-')) el.removeAttribute(a.name);
  const hasText = !!svg.querySelector('text');
  const fontFamily = svg.querySelector('text')?.getAttribute('font-family') || svg.querySelector('[font-family]')?.getAttribute('font-family') || null;
  const embeddedFont = /@font-face[^}]*url\(\s*["']?data:/.test(src);
  svg.removeAttribute('width'); svg.removeAttribute('height');
  return { markup: new XMLSerializer().serializeToString(svg), vb, lastStep, enter: [...roles.enter], loop: [...roles.loop], spin: !!spinEl, problems, hasText, fontFamily, embeddedFont };
}, source);
await browser.close();
if (parsed.error) { console.error(parsed.error); process.exit(1); }
if (parsed.problems.length) { console.error(parsed.problems.join('\n')); process.exit(1); }
if (modes.includes('once') && !parsed.enter.length) console.warn('No part has data-enter, so the once version will not move. Tag parts with data-enter="pop" and the like.');
if ((modes.includes('loop') || modes.includes('component')) && !parsed.loop.length && !parsed.spin) console.warn('No part has data-loop or data-spin, so the loop and component versions will not move.');

// ---- Fonts: a logo with words carries its font inside it, or it changes on every machine. ----
let fontFace = '';
if (flags.font) {
  const fam = flags['font-family'] || parsed.fontFamily?.split(',')[0].replace(/["']/g, '').trim();
  if (!fam) { console.error('Pass --font-family to name the font the text uses.'); process.exit(1); }
  const fmt = extname(flags.font).toLowerCase() === '.ttf' ? 'truetype' : 'woff2';
  fontFace = `@font-face{font-family:"${fam}";${flags['font-weight'] ? `font-weight:${flags['font-weight']};` : ''}src:url(data:font/${fmt === 'truetype' ? 'ttf' : 'woff2'};base64,${readFileSync(resolve(flags.font)).toString('base64')}) format("${fmt}")}`;
} else if (parsed.hasText && !parsed.embeddedFont) {
  console.warn('The SVG has text but no font built in, so it will show in whatever font each device has. Pass --font <file.woff2>, or turn the text into paths.');
}

// ---- The motion. ----
const [, , vw, vh] = parsed.vb;
const playful = style === 'playful';
const back = playful ? 'cubic-bezier(.3,1.5,.5,1)' : 'cubic-bezier(.2,.8,.2,1)';
const ease = 'cubic-bezier(.2,.8,.2,1)';
const gap = 0.15;                                   // seconds between steps
const blinkAt = (parsed.lastStep + 1) * gap + 0.8;  // after everything has arrived
const vars = `svg,:host{--rise:${(0.08 * vh).toFixed(1)}px;--bob:${(0.03 * vh).toFixed(1)}px;--look:${(0.035 * vw).toFixed(1)}px}`;
const delay = `calc(var(--step,0) * ${gap}s + var(--i,0) * .06s)`;
const ENTER_CSS = `
.a-in-pop{animation:a-pop .55s ${back} ${delay} both}
.a-in-fade{animation:a-fade .5s ease-out ${delay} both}
.a-in-rise{animation:a-rise .45s ${ease} ${delay} both}
.a-in-drop{animation:a-drop .45s ${back} ${delay} both}
.a-in-slide{animation:a-slide .45s ${back} ${delay} both}
.a-in-grow{animation:a-grow .4s ${back} ${delay} both}
.a-in-draw{stroke-dasharray:1;animation:a-draw .7s cubic-bezier(.6,0,.2,1) ${delay} both}
.a-in-open{animation:a-open .25s ease-out ${delay} both}
.a-in-open.a-blink-after{animation:a-open .25s ease-out ${delay} both,a-blink-once .22s ease-in-out ${blinkAt.toFixed(2)}s}
.a-in-spin-in{animation:a-spin-in .9s ${ease} ${delay} both}
@keyframes a-pop{from{opacity:0;transform:scale(${playful ? '.4' : '.8'})}to{opacity:1;transform:none}}
@keyframes a-fade{from{opacity:0}}
@keyframes a-rise{from{opacity:0;transform:translateY(var(--rise))}}
@keyframes a-drop{from{opacity:0;transform:translateY(calc(-1 * var(--rise)))}}
@keyframes a-slide{from{opacity:0;transform:translate(var(--dx),var(--dy))}}
@keyframes a-grow{from{transform:scale(0)}}
@keyframes a-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
@keyframes a-open{from{transform:scaleY(0)}}
@keyframes a-spin-in{from{opacity:0;transform:rotate(-200deg) scale(.4)}}
@keyframes a-blink-once{50%{transform:scaleY(.1)}}
@media (prefers-reduced-motion:reduce){[class*="a-in-"]{animation:none!important;opacity:1;transform:none;stroke-dashoffset:0}}`;
// Loop roles. `scope` puts them behind :host([busy]) for the component; `tempo` speeds them up there.
const loopCss = (scope, tempo) => {
  const t = (s) => (s * tempo).toFixed(2) + 's';
  const P = scope ? scope + ' ' : '';
  const D = { bob: 1.8, look: 3.6, blink: 3.6, wiggle: 1.8, pulse: 2, sway: 2.4 };
  // data-reverse starts the part half a beat later, so a pair alternates. Playing it backwards would
  // not: most of these keyframes look the same in both directions.
  return `
${Object.entries(D).map(([r, d]) => `${P}.a-loop-${r}{animation:a-${r} ${t(d)} ease-in-out infinite}${P}.a-loop-${r}.a-reverse{animation-delay:-${t(d / 2)}}`).join('\n')}
@keyframes a-bob{50%{transform:translateY(calc(-1 * var(--bob)))}}
@keyframes a-look{0%,15%{transform:none}25%,40%{transform:translateX(calc(-1 * var(--look)))}55%,70%{transform:translateX(var(--look))}80%,100%{transform:none}}
@keyframes a-blink{0%,44%,52%,100%{transform:none}48%{transform:scaleY(.1)}}
@keyframes a-wiggle{50%{transform:scaleX(.85)}}
@keyframes a-pulse{50%{opacity:.55}}
@keyframes a-sway{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}`;
};
const loopReduced = (scope) => `@media (prefers-reduced-motion:reduce){${scope ? scope + ' ' : ''}[class*="a-loop-"],${scope ? scope + ' ' : ''}.a-spin{animation:none!important}${scope ? scope + ' svg' : 'svg'}{animation:a-pulse 2s ease-in-out infinite}}`;
// A full turn now and then. In an SVG file that is a keyframe over the whole period.
const spinCssLoop = () => {
  if (!parsed.spin || !(spinEvery > 0)) return '';
  const hold = Math.max(0, 100 - (0.9 / spinEvery) * 100).toFixed(1);
  return `.a-spin{animation:a-turn-every ${spinEvery}s cubic-bezier(.6,0,.25,1) infinite}@keyframes a-turn-every{0%,${hold}%{transform:none}100%{transform:rotate(360deg)}}`;
};

const withStyle = (css) => parsed.markup.replace(/<svg([^>]*)>/, `<svg$1><style>${fontFace}${css}</style>`);
const written = [];
const write = (f, text) => { writeFileSync(join(out, f), text); written.push(f); };

write(`${name}-still.svg`, withStyle(''));
if (modes.includes('once')) write(`${name}.svg`, withStyle(vars + ENTER_CSS));
if (modes.includes('loop')) write(`${name}-loop.svg`, withStyle(vars + loopCss('', 1) + spinCssLoop() + loopReduced('')));
if (modes.includes('component')) {
  const className = tag.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
  const css = `:host{display:inline-block;width:96px;line-height:0}svg{width:100%;height:auto;overflow:visible}${fontFace}${vars}${loopCss(':host([busy])', 0.5)}
.a-once [class*="a-loop-blink"]{animation:a-blink .3s ease-in-out}.a-once [class*="a-loop-blink"]{animation-iteration-count:1}
.a-spinning .a-spin{animation:a-turn .9s cubic-bezier(.6,0,.25,1)}@keyframes a-turn{to{transform:rotate(360deg)}}
${loopReduced(':host([busy])')}@media (prefers-reduced-motion:reduce){.a-spinning .a-spin,.a-once *{animation:none!important}}`;
  write(`${name}.js`, `// <${tag}> - ${label}, still until something is happening.
//
//   <script src="${name}.js"></script>
//   <${tag}></${tag}>                   still
//   <${tag} busy></${tag}>              moves until busy is removed
//   el.busy = true / false             the same from code
//   el.blink()                         one blink, as an acknowledgement
//   await el.track(promise)            busy while the promise runs, then one blink
//   <${tag} spin="4">                  while busy, a full turn every 4 seconds; spin="0" never turns
//   <${tag} label="${label}">          what screen readers hear; while busy they hear "${label} is working"
//
// Size it with CSS: ${tag} { width: 48px; }. People who reduce motion see a gentle fade instead.
// Made by the logo-animate skill from ${basename(file)}.
(() => {
const CSS = ${JSON.stringify(css)};
const SVG = ${JSON.stringify(parsed.markup)};
class ${className} extends HTMLElement {
  static observedAttributes = ['busy', 'label', 'spin'];
  #timer = null;
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = '<style>' + CSS + '</style>' + SVG;
    this.svg = root.querySelector('svg');
    this.svg.setAttribute('role', 'img');
  }
  connectedCallback() { this.#update(); }
  disconnectedCallback() { clearInterval(this.#timer); this.#timer = null; }
  attributeChangedCallback() { this.#update(); }
  get busy() { return this.hasAttribute('busy'); }
  set busy(on) { this.toggleAttribute('busy', !!on); }
  blink() {
    if (this.busy) return;
    this.svg.classList.remove('a-once'); void this.svg.getBoundingClientRect(); this.svg.classList.add('a-once');
    setTimeout(() => this.svg.classList.remove('a-once'), 350);
  }
  async track(promise) {
    this.busy = true;
    try { return await promise; } finally { this.busy = false; this.blink(); }
  }
  #update() {
    const name = this.getAttribute('label') || ${JSON.stringify(label)};
    this.svg.setAttribute('aria-label', this.busy ? name + ' is working' : name);
    this.setAttribute('aria-busy', String(this.busy));
    // The first turn comes after one full period, so a quick task never spins.
    clearInterval(this.#timer); this.#timer = null;
    const every = Number(this.getAttribute('spin') ?? ${spinEvery});
    if (!this.busy || !this.isConnected || !(every > 0) || !this.svg.querySelector('.a-spin')) return;
    this.#timer = setInterval(() => {
      this.svg.classList.remove('a-spinning'); void this.svg.getBoundingClientRect(); this.svg.classList.add('a-spinning');
      setTimeout(() => this.svg.classList.remove('a-spinning'), 950);
    }, every * 1000);
  }
}
if (!customElements.get(${JSON.stringify(tag)})) customElements.define(${JSON.stringify(tag)}, ${className});
})();
`);
}

// ---- Preview: every output on light and dark. ----
const tiles = (src, alt, cls = '') => `<div class="pair"><div class="tile light"><img ${cls} src="${src}" alt="${alt}"></div><div class="tile dark"><img ${cls} src="${src}" alt="${alt}"></div></div>`;
const sections = [];
if (modes.includes('once')) sections.push(`<section><h2>Plays once</h2>${tiles(`${name}.svg`, label, 'class="replay"')}<button onclick="replay()">Replay</button></section>`);
if (modes.includes('loop')) sections.push(`<section><h2>Loops</h2>${tiles(`${name}-loop.svg`, 'Loading')}</section>`);
if (modes.includes('component')) sections.push(`<section><h2>Busy</h2><div class="pair"><div class="tile light"><${tag}></${tag}></div><div class="tile dark"><${tag}></${tag}></div></div>
<button id="busy" onclick="toggleBusy()">Start working</button> <button onclick="document.querySelectorAll('${tag}').forEach(b => b.blink())">Blink once</button></section>`);
sections.push(`<section><h2>Still</h2>${tiles(`${name}-still.svg`, label)}</section>`);
write(`${name}-preview.html`, `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${label}</title>
<style>
  body { margin: 0; font: 17px/1.5 system-ui, sans-serif; color: #1c1c22; background: #f6f6f8; }
  main { max-width: 960px; margin: 0 auto; padding: 24px 16px 48px; display: grid; gap: 28px; }
  h1 { font-size: 26px; margin: 0; } h2 { font-size: 19px; margin: 0 0 10px; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; border-radius: 12px; overflow: hidden; border: 1px solid #e4e4ea; margin-bottom: 10px; }
  .tile { display: grid; place-items: center; height: 200px; padding: 16px; } .light { background: #fff; } .dark { background: #0b0b10; }
  .tile img, .tile ${tag} { max-width: 80%; max-height: 150px; width: auto; }
  .tile ${tag} { width: 110px; }
  button { font: inherit; font-size: 16px; font-weight: 600; padding: 8px 14px; border-radius: 8px; border: 1px solid #d0d0d8; background: #fff; cursor: pointer; }
  @media (max-width: 520px) { .pair { grid-template-columns: 1fr; } }
</style></head>
<body><main><h1>${label}</h1>${sections.join('\n')}</main>
${modes.includes('component') ? `<script src="${name}.js"></script>` : ''}
<script>
  function replay() { document.querySelectorAll('img.replay').forEach(i => { i.src = i.src.split('?')[0] + '?' + Date.now(); }); }
  function toggleBusy() { const bots = document.querySelectorAll('${tag}'); const on = !bots[0].busy; bots.forEach(b => { b.busy = on; if (!on) b.blink(); }); document.getElementById('busy').textContent = on ? 'Stop working' : 'Start working'; }
</script></body></html>
`);

console.log(`${name}: ${parsed.enter.length ? 'arrives with ' + parsed.enter.join(', ') : 'no arrival roles'}; ${parsed.loop.length ? 'loops with ' + parsed.loop.join(', ') : 'no loop roles'}${parsed.spin ? ', turns' : ''}; style ${style}`);
for (const f of written) console.log('  ' + join(out, f));
