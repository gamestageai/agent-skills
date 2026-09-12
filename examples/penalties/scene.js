/** Rendering geometry and replay interpolation. No scoring or keeper decisions. */
export const FIELD = Object.freeze({
  halfWidth: 3.66,
  height: 2.44,
  distance: 11,
  radius: 0.11,
  postRadius: 0.06,
  depth: 1.8,
});
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};
// Articulated silhouette, positioned by the committed keeper plan.
export function keeperPose(k) {
  const d = clamp(k.dive, 0, 1),
    angle = k.side * smooth(d) * 1.1;
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const p = (dx, dy) => ({
    x: k.x + dx * c + dy * s,
    y: k.y - 0.02 - dx * s + dy * c,
  });
  const pose = {
    hip: p(0, 0),
    hip1: p(-0.125, -0.03),
    hip2: p(0.125, -0.03),
    shoulder: p(0, 0.48),
    shoulder1: p(-0.23, 0.46),
    shoulder2: p(0.23, 0.46),
    neck: p(0, 0.6),
    head: p(0, 0.74),
    knee1: p(-0.23, -0.39 + d * 0.04),
    knee2: p(0.25, -0.37 + d * 0.06),
    foot1: p(-0.37, -0.83 + d * 0.16),
    foot2: p(0.38 - d * 0.13, -0.83 + d * 0.32),
    elbow1: p(lerp(-0.38, -0.18, d), lerp(0.24, 0.79, d)),
    elbow2: p(lerp(0.38, 0.28, d), lerp(0.24, 0.8, d)),
    hand1: p(lerp(-0.54, -0.1, d), lerp(0.28, 1.09, d)),
    hand2: p(lerp(0.54, 0.11, d), lerp(0.28, 1.07, d)),
  };
  for (const key of ["foot1", "foot2"])
    pose[key].y = Math.max(0.055, pose[key].y);
  for (const key of ["knee1", "knee2"])
    pose[key].y = Math.max(0.14, pose[key].y);
  return pose;
}
/** Render a committed v1 result without adjudicating anything in the page. */
export function trajectoryFromRecord(record) {
  const replay = record.replay,
    duration = replay.flightMs / 1000;
  const ex = (replay.ball.endX / 1000) * FIELD.halfWidth,
    ey = (replay.ball.endY / 1000) * FIELD.height;
  const frames = [];
  const side = Math.sign(replay.keeper.endX - replay.keeper.startX) || 1;
  const times = [duration];
  for (let t = 0; t <= duration + 1.45; t += 1 / 80) times.push(t);
  times.sort((a, b) => a - b);
  for (const t of times) {
    const u = clamp(t / duration, 0, 1),
      after = Math.max(0, t - duration);
    const ku = clamp(
      (t - replay.keeper.diveStartMs / 1000) /
        Math.max(0.05, duration - replay.keeper.diveStartMs / 1000),
      0,
      1,
    );
    let x = ex * u,
      y =
        lerp(FIELD.radius, ey, u) +
        ((4 * u * (1 - u) * replay.ball.arcHeight) / 1000) * FIELD.height,
      z = 11 * (1 - u);
    if (after > 0) {
      x = ex;
      y = Math.max(FIELD.radius, ey - 3 * after * after);
      z =
        record.result === "goal"
          ? -Math.min(1.6, after * 4)
          : record.result === "wide"
            ? -after * 6
            : after * 3;
    }
    frames.push({
      t,
      x,
      y,
      z,
      kx:
        (lerp(replay.keeper.startX, replay.keeper.endX, ku) / 1000) *
        FIELD.halfWidth,
      ky:
        (lerp(replay.keeper.startY, replay.keeper.endY, ku) / 1000) *
        FIELD.height,
      dive: ku,
      side,
    });
  }
  return {
    trajectory: frames,
    events: [
      { type: record.result, t: duration, x: ex, y: ey, z: 0 },
      ...(record.result === "goal"
        ? [{ type: "net", t: duration + 0.25, x: ex, y: ey, z: -1.2 }]
        : []),
    ],
    duration: frames.at(-1).t,
  };
}
export function sampleTrajectory(frames, t) {
  if (t <= 0) return frames[0];
  if (t >= frames.at(-1).t) return frames.at(-1);
  let lo = 0,
    hi = frames.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].t < t) lo = mid;
    else hi = mid;
  }
  const a = frames[lo],
    b = frames[hi],
    u = (t - a.t) / (b.t - a.t);
  const out = {};
  for (const key of Object.keys(a)) out[key] = lerp(a[key], b[key], u);
  return out;
}
