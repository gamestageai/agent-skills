/** Readable defaults, overridden by the same runtime display channel as the shell. */
export const defaults = {
  title: 'ELEVEN.', goals: 'goals', score: 'Points', scoreLabel: 'Shootout score', pitchLabel: 'Penalty pitch',
  pitchHelp: '',
  soundOn: 'Turn sound on', soundOff: 'Turn sound off', help: '',
  results: 'Penalty results', controls: 'Shot controls', instruction: '',
  shoot: '', options: '', aim: 'Aim', quickAim: 'Quick aim', power: 'Power',
  topLeft: '', topCentre: '', topRight: '',
  lowLeft: '', lowCentre: '', lowRight: '',
  replay: '', watchLast: 'Watch the last penalty', complete: 'Round complete',
  waiting: 'On its way…', flight: 'In flight…', loading: 'Opening the pitch…',
  ready: 'The keeper is ready.', retry: '',
  busy: 'The game is busy. Try this penalty again in a moment.', refused: 'The shot was refused. Your progress has been refreshed.',
  stale: 'The round changed. Reload to open it.', offline: 'You are offline. Your committed shots are safe.',
  reconnecting: 'Reconnecting…', unavailable: 'The pitch could not open. Reload to try again.',
  disconnected: 'Live updates are not reaching this page. Reload to try again.',
  goal: '', saved: '', frame: '', wide: '', over: '',
  wonTitle: '', lostTitle: 'Another chance.',
  wonCopy: 'You held your nerve from the spot. Can you do it again?',
  lostCopy: 'The keeper takes this round. Find your corner and come back stronger.',
  target: '{n} to win', shot: 'Penalty {n} of {total}', notTaken: 'Not taken',
  helpTitle: 'From the spot.', close: 'Close instructions', helpTarget: 'Score {n} of your {total} penalties to win.',
  pointerTitle: 'Touch or mouse', pointerHelp: 'Aim at the goal. Hold to build power, then release. Open Shot options for aim presets and power.',
  keyboardTitle: 'Keyboard', keyboardHelp: 'Arrow keys aim. Hold Space to charge, release to shoot. Enter takes a shot.',
  finesseTitle: 'A little finesse', finesseHelp: 'More power means a faster shot and less precise placement. Leave a little room for the posts.',
  play: "Let's play", another: '',
};
/** The words this page shares with the gamestage.ai taster come from Studio's
 * label_taster_* settings, and the page keeps no copy of them. GS-580. */
export const SHARED = {"pitchHelp":"shoot_pitch_label", "help":"tab_how", "instruction":"shoot_instruction", "options":"shoot_options_label", "topLeft":"shoot_zone_top_left", "topCentre":"shoot_zone_top_centre", "topRight":"shoot_zone_top_right", "lowLeft":"shoot_zone_low_left", "lowCentre":"shoot_zone_low_centre", "lowRight":"shoot_zone_low_right", "replay":"shoot_replay_label", "retry":"shoot_retry_label", "goal":"shoot_goal_label", "saved":"shoot_saved_label", "frame":"shoot_frame_label", "wide":"shoot_wide_label", "over":"shoot_over_label", "wonTitle":"won_label", "another":"play_another_label"};
export function resolveCopy(display = {}, presentation = {}) {
  const overrides = display.elevenCopy ?? {};
  const labels = presentation.labels ?? {};
  const shared = (key) => labels[`taster_${SHARED[key]}`];
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => {
    const theirs = overrides[key];
    if (typeof theirs === 'string' && theirs.trim()) return [key, theirs];
    if (key === 'shoot') return [key, presentation.playButtonLabel ?? ''];
    return [key, SHARED[key] ? (shared(key) ?? '') : value];
  }));
}
export function applyCopy(copy) {
  for (const node of document.querySelectorAll('[data-copy]')) node.textContent = copy[node.dataset.copy];
  for (const node of document.querySelectorAll('[data-label]')) node.setAttribute('aria-label', copy[node.dataset.label]);
}

/** The Engine calls every off-target miss `wide`; its committed height tells
 * us whether to say OVER. Frame includes both posts and the crossbar. */
export function resultCopyKey(shot) {
  return shot.result === 'wide' && shot.replay.ball.endY > 1000 ? 'over' : shot.result;
}
