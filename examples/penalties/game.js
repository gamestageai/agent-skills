import { start, applyPresentation, shootProgressOf, latestShot } from 'https://gamestage.ai/client/0.49.0/gamestage.js';
import { Pitch } from './pitch.js';
import { Sound } from './audio.js';
import { shootPending } from './pending.js';
import { resolveCopy, applyCopy, resultCopyKey } from './copy.js';
const el = id => document.getElementById(id);
let game, state, lastShot, display;
let copy = resolveCopy();
let playLabel = copy.shoot;
const sound = new Sound();
const notice = text => { el('connection').textContent = text ?? ''; el('connection').hidden = !text; };
const template = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
applyCopy(copy);
const pitch = new Pitch(el('pitch'), syncControls, shoot);
function syncControls(view) {
  const ready = view.phase === 'ready';
  el('result-title').textContent = view.verdict ?? '';
  const busy = !['ready', 'complete'].includes(view.phase);
  el('shoot').disabled = !ready;
  el('shoot-label').textContent = view.phase === 'complete' ? copy.complete : view.phase === 'waiting' ? copy.waiting : view.phase === 'flight' ? copy.flight : playLabel;
  el('replay').disabled = !lastShot || busy;
  el('pitch').setAttribute('aria-disabled', String(!ready));
  el('power').disabled = !ready;
  el('power').value = view.power;
  el('power-value').textContent = `${Math.round(view.power / 10)}%`;
  for (const button of document.querySelectorAll('[data-aim]')) {
    const [x, y] = button.dataset.aim.split(',').map(Number);
    button.disabled = !ready;
    const selected = view.aim.x === x && view.aim.y === y;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
}
function dots(target) {
  const shots = shootProgressOf(state)?.shots ?? [];
  target.replaceChildren(...Array.from({ length: state.attempts_allowed }, (_, i) => {
    const shot = shots[i], dot = document.createElement(target.tagName === 'OL' ? 'li' : 'span');
    dot.className = `shot-dot${shot ? shot.result === 'goal' ? ' goal' : ' miss' : i === state.attempts_used ? ' active' : ''}`;
    if (shot) dot.dataset.shotResult = shot.result;
    dot.textContent = shot && shot.result !== 'goal' ? '×' : '';
    dot.setAttribute('aria-label', `${i + 1}: ${shot ? copy[resultCopyKey(shot)] : copy.notTaken}`);
    return dot;
  }));
}
function renderState() {
  const progress = shootProgressOf(state);
  el('goals').textContent = progress?.goals ?? 0;
  el('total-shots').textContent = state.attempts_allowed;
  el('score').textContent = state.score;
  el('shot-label').textContent = template(copy.shot, { n: Math.min(state.attempts_used + 1, state.attempts_allowed), total: state.attempts_allowed });
  dots(el('shot-dots'));
}
function presentation() {
  copy = resolveCopy(display);
  applyCopy(copy);
  const targets = { displayName: el('game-name'), strapline: el('strapline'), howToPlay: el('how-to-play'), playButtonLabel: el('shoot-label'), editionName: el('edition-name'), editionStrapline: el('edition-line'), root: document.documentElement };
  applyPresentation(game.presentation, targets, { displayName: game.deployedName });
  playLabel = el('shoot-label').textContent;
  document.title = el('game-name').textContent;
  pitch.sync();
}
function renderRound() {
  const challenge = game.round.challenge;
  el('prompt').textContent = challenge.prompt ?? '';
  el('goal-target').textContent = template(copy.target, { n: challenge.goals_to_win });
  el('help-target').textContent = template(copy.helpTarget, { n: challenge.goals_to_win, total: state.attempts_allowed });
  // Bounds are public input geometry, never a local scoring model.
  if (challenge.input?.power) [el('power').min, el('power').max] = challenge.input.power;
}
async function end() {
  const won = state.outcome === 'won';
  el('end-title').textContent = won ? copy.wonTitle : copy.lostTitle;
  el('end-copy').textContent = won ? copy.wonCopy : copy.lostCopy;
  el('end-goals').textContent = shootProgressOf(state)?.goals ?? 0;
  el('end-total').textContent = `/ ${state.attempts_allowed}`;
  el('end-dialog').dataset.outcome = state.outcome;
  dots(el('end-shots'));
  el('watch-last').disabled = !lastShot;
  if (!el('end-dialog').open) el('end-dialog').showModal();

}
async function shoot(intent) {
  if (!game || !state || state.finished) return;
  el('pitch-status').classList.remove('error');
  try {
    const result = await shootPending(game, { ...intent, shotIndex: state.attempts_used });
    if (!['accepted', 'duplicate'].includes(result.outcome)) {
      state = await game.client.getRoundState(game.round.id);
      renderState();
      pitch.ready(Boolean(state.finished));
      el('pitch-status').classList.add('error');
      el('pitch-status').textContent = result.outcome === 'busy' ? copy.busy : result.outcome === 'stale' ? copy.stale : copy.refused;
      if (state.finished) await end();
      return;
    }
    lastShot = result.shot;
    sound.play('kick');
    await pitch.animate(lastShot, copy[resultCopyKey(lastShot)]);
    state = result.round_state;
    renderState();
    sound.play(lastShot.result);
    pitch.ready(Boolean(state.finished));
    if (state.finished) await end();
  } catch {
    el('pitch-status').classList.add('error');
    el('pitch-status').textContent = copy.retry;
    pitch.ready(Boolean(state?.finished));
  }
}
async function replay() {
  if (!lastShot || !['ready', 'complete'].includes(pitch.phase)) return;
  el('end-dialog').close();
  await pitch.animate(lastShot, copy[resultCopyKey(lastShot)], true);
  pitch.ready(Boolean(state.finished));
  if (state.finished) await end();
}
el('shoot').onclick = () => pitch.shoot();
el('replay').onclick = replay;
el('watch-last').onclick = replay;
el('power').oninput = e => pitch.setPower(Number(e.target.value));
for (const button of document.querySelectorAll('[data-aim]')) button.onclick = () => pitch.setAim(...button.dataset.aim.split(',').map(Number));
el('sound').onclick = () => {
  sound.enabled = !sound.enabled;
  sound.activate();
  el('sound').setAttribute('aria-pressed', String(sound.enabled));
  el('sound').setAttribute('aria-label', sound.enabled ? copy.soundOff : copy.soundOn);
};
el('help').onclick = () => { pitch.cancelCharge(); el('help-dialog').showModal(); };
for (const button of document.querySelectorAll('.close-dialog')) button.onclick = () => el('help-dialog').close();
addEventListener('offline', () => { pitch.cancelCharge(); notice(copy.offline); });
addEventListener('online', async () => {
  notice(copy.reconnecting);
  try {
    if (!game) { location.reload(); return; }
    // Never replace a shot that is still being drawn with a background read.
    if (['ready', 'complete'].includes(pitch.phase)) {
      state = await game.client.getRoundState(game.round.id);
      renderState(); pitch.ready(Boolean(state.finished));
      if (state.finished) await end();
    }
    notice(null);
  } catch { notice(copy.retry); }
});
async function main() {
  game = await start({ globals: { ...window, GAMESTAGE_API: window.GAMESTAGE_API, GAMESTAGE_GAME: window.GAMESTAGE_GAME }, identity: () => window.GAMESTAGE_TOKEN });
  display = (await game.client.getRuntime()).display;
  presentation();
  game.onPresentationChanged(presentation);
  // The client re-reads the round on every platform announcement, changed or
  // not, so only a different round or version is stale; the same one is noise.
  let seen = { id: game.round.id, version: game.round.version };
  game.onRoundChanged(next => {
    if (next.id === seen.id && next.version === seen.version) return;
    seen = { id: next.id, version: next.version };
    pitch.setPhase('loading'); notice(copy.stale);
  });
  state = await game.client.getRoundState(game.round.id);
  lastShot = latestShot(shootProgressOf(state));
  renderRound(); renderState(); pitch.ready(Boolean(state.finished));
  const local = ['localhost', '127.0.0.1', '[::1]', ''].includes(location.hostname);
  notice(game.platform === 'local' && !local ? copy.disconnected : null);
  if (state.finished) await end();
}
main().catch(() => notice(copy.unavailable));
