/** Persist before sending, and retain the intent, version and key across retries. */
export async function shootPending(game, intent) {
  const round = game.round;
  if (!round) throw new Error('No round');
  // Scope pending work to the SDK's real identity/session, never a page-made player id.
  const token = game.identity.kind === 'identified' ? game.identity.token : localStorage.getItem(`gamestage-session:${game.id}`);
  if (!token) throw new Error('No Engine session');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const scope = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
  const key = `eleven-pending:${game.id}:${round.id}:${scope}`;
  let pending = JSON.parse(sessionStorage.getItem(key) || 'null');
  if (!pending) {
    pending = { ...intent, idempotencyKey: crypto.randomUUID(), roundId: round.id, version: round.version };
    sessionStorage.setItem(key, JSON.stringify(pending));
  }
  if (pending.roundId !== round.id || pending.version !== round.version) {
    sessionStorage.removeItem(key);
    throw new Error('Round changed');
  }
  if (pending.retryAt > Date.now()) return { outcome: 'busy', retry_after_seconds: Math.ceil((pending.retryAt - Date.now()) / 1000) };
  const { roundId, version, retryAt, ...payload } = pending;
  const result = await game.shoot(payload);
  if (result.outcome === 'busy') {
    pending.retryAt = Date.now() + (result.retry_after_seconds ?? 1) * 1000;
    sessionStorage.setItem(key, JSON.stringify(pending));
  } else {
    sessionStorage.removeItem(key);
    // A receipt can predate another tab's later shots. Never roll those counters back.
    if (result.outcome === 'duplicate') result.round_state = await game.client.getRoundState(round.id);
  }
  return result;
}
