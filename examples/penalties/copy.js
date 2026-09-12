/** Readable defaults, overridden by the same runtime display channel as the shell. */
export const defaults = {
  title: 'ELEVEN.', goals: 'goals', score: 'Points', scoreLabel: 'Shootout score', pitchLabel: 'Penalty pitch',
  pitchHelp: 'Aim at the goal. Hold to charge and release to shoot. Arrow keys aim; hold and release Space to shoot.',
  soundOn: 'Turn sound on', soundOff: 'Turn sound off', help: 'How to play',
  results: 'Penalty results', controls: 'Shot controls', instruction: 'Aim. Hold. Release.',
  shoot: 'Take the shot', options: 'Shot options', aim: 'Aim', quickAim: 'Quick aim', power: 'Power',
  topLeft: 'Top left', topCentre: 'Top centre', topRight: 'Top right',
  lowLeft: 'Low left', lowCentre: 'Low centre', lowRight: 'Low right',
  replay: 'Replay', watchLast: 'Watch the last penalty', complete: 'Round complete',
  waiting: 'On its way…', flight: 'In flight…', loading: 'Opening the pitch…',
  ready: 'The keeper is ready.', retry: 'Could not reach the game. Try again to send the same penalty.',
  busy: 'The game is busy. Try this penalty again in a moment.', refused: 'The shot was refused. Your progress has been refreshed.',
  stale: 'The round changed. Reload to open it.', offline: 'You are offline. Your committed shots are safe.',
  reconnecting: 'Reconnecting…', unavailable: 'The pitch could not open. Reload to try again.',
  disconnected: 'Live updates are not reaching this page. Reload to try again.',
  goal: 'GOAL', saved: 'SAVED', frame: 'POST', wide: 'WIDE', over: 'OVER',
  wonTitle: 'Ice cold.', lostTitle: 'Another chance.',
  wonCopy: 'You held your nerve from the spot. Can you do it again?',
  lostCopy: 'The keeper takes this round. Find your corner and come back stronger.',
  target: '{n} to win', shot: 'Penalty {n} of {total}', notTaken: 'Not taken',
  helpTitle: 'From the spot.', close: 'Close instructions', helpTarget: 'Score {n} of your {total} penalties to win.',
  pointerTitle: 'Touch or mouse', pointerHelp: 'Aim at the goal. Hold to build power, then release. Open Shot options for aim presets and power.',
  keyboardTitle: 'Keyboard', keyboardHelp: 'Arrow keys aim. Hold Space to charge, release to shoot. Enter takes a shot.',
  finesseTitle: 'A little finesse', finesseHelp: 'More power means a faster shot and less precise placement. Leave a little room for the posts.',
  play: "Let's play", another: 'Play another',
};
export function resolveCopy(display = {}) {
  const overrides = display.elevenCopy ?? {};
  return Object.fromEntries(Object.entries(defaults).map(([key, value]) => [key,
    typeof overrides[key] === 'string' && overrides[key].trim() ? overrides[key] : value]));
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
