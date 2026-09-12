import {
  FIELD,
  clamp,
  lerp,
  smooth,
  sampleTrajectory,
  keeperPose,
} from "./scene.js";
export class PitchRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.w = 1;
    this.h = 1;
    this.time = 0;
    this.aim = { x: 0, y: 500 };
    this.power = 0.65;
    this.phase = "ready";
    this.motion = null;
    this.verdict = '';
    this.motionTime = 0;
    this.shake = 0;
    this.netHit = null;
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.resize();
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
  }
  destroy() { this.observer.disconnect(); }
  resize() {
    const box = this.canvas.getBoundingClientRect();
    this.w = box.width;
    this.h = box.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * dpr);
    this.canvas.height = Math.round(this.h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.base = Math.min(this.w * 0.106, this.h * 0.172);
    this.goalGround = this.h * (this.w < 600 ? 0.4 : 0.48);
  }
  project(x, y, z) {
    const factor = 24 / (24 - z);
    return {
      x: this.w * 0.5 + x * this.base * factor,
      y:
        this.goalGround +
        z * factor * ((this.h * 0.835 - this.goalGround) / (11 * (24 / 13))) -
        y * this.base * factor,
      s: this.base * factor,
    };
  }
  aimFromPoint(x, y) {
    return {
      x: Math.round(
        clamp(
          ((x - this.w * 0.5) / this.base / FIELD.halfWidth) * 1000,
          -1200,
          1200,
        ),
      ),
      y: Math.round(
        clamp(
          ((this.goalGround - y) / this.base / FIELD.height) * 1000,
          -200,
          1200,
        ),
      ),
    };
  }
  line(points, colour = "#191919", width = 1) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((v, i) => {
      const p = this.project(...v);
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
    });
    c.strokeStyle = colour;
    c.lineWidth = width;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.stroke();
  }
  polygon(points, fill, stroke) {
    const c = this.ctx;
    c.beginPath();
    points.forEach((v, i) => {
      const p = this.project(...v);
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y);
    });
    c.closePath();
    if (fill) {
      c.fillStyle = fill;
      c.fill();
    }
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1;
      c.stroke();
    }
  }
  circle3(x, y, z, r, fill) {
    const p = this.project(x, y, z);
    this.ctx.beginPath();
    this.ctx.arc(p.x, p.y, Math.max(0.5, r * p.s), 0, Math.PI * 2);
    this.ctx.fillStyle = fill;
    this.ctx.fill();
  }
  drawGround() {
    const c = this.ctx,
      w = this.w,
      h = this.h;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#eeeee9");
    g.addColorStop(0.47, "#e8e8e2");
    g.addColorStop(1, "#ddddd5");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    // Open ground and quiet, perspective-cut grass strips.
    for (let z = -10; z < 18; z += 3)
      this.polygon(
        [
          [-30, 0, z],
          [30, 0, z],
          [30, 0, z + 1.5],
          [-30, 0, z + 1.5],
        ],
        "#00000003",
      );
    this.line(
      [
        [-30, 0, 0],
        [30, 0, 0],
      ],
      "#ffffff9c",
      1.4,
    );
    this.line(
      [
        [-9.16, 0, 0],
        [-9.16, 0, 5.5],
        [9.16, 0, 5.5],
        [9.16, 0, 0],
      ],
      "#ffffffb8",
      1.5,
    );
    this.line(
      [
        [-20.16, 0, 0],
        [-20.16, 0, 16.5],
        [20.16, 0, 16.5],
        [20.16, 0, 0],
      ],
      "#ffffff99",
      1.3,
    );
    const arc = [];
    for (let a = 0.1; a < Math.PI - 0.1; a += 0.04)
      arc.push([Math.cos(a) * 5, 0, 11 + Math.sin(a) * 5]);
    this.line(arc, "#ffffff77", 1.2);
    this.circle3(0, 0.005, 11, 0.09, "#ffffffbd");
    // Pitch edge details anchor the sparse scene without using scenery assets.
    for (const side of [-1, 1]) {
      this.line(
        [
          [side * 11, 0, -1],
          [side * 11, 1.1, -1],
        ],
        "#77776d",
        1,
      );
      this.polygon(
        [
          [side * 11, 1.1, -1],
          [side * 11 + 0.35, 1, -1],
          [side * 11, 0.84, -1],
        ],
        "#77776d",
      );
    }
    const grad = c.createRadialGradient(
      w * 0.5,
      h * 0.6,
      h * 0.15,
      w * 0.5,
      h * 0.6,
      w * 0.65,
    );
    grad.addColorStop(0, "#ffffff00");
    grad.addColorStop(1, "#ffffff26");
    c.fillStyle = grad;
    c.fillRect(0, 0, w, h);
  }
  netPoint(x, y, z) {
    if (!this.netHit || this.reduced) return [x, y, z];
    const age = this.time - this.netHit.at;
    if (age > 1) return [x, y, z];
    const distance = Math.hypot(x - this.netHit.x, y - this.netHit.y);
    const wave =
      Math.sin(age * 22 - distance * 2.8) *
      Math.exp(-age * 4) *
      Math.exp(-distance * 0.9) *
      0.28;
    return [x, y, z - wave];
  }
  drawGoalBack() {
    const w = FIELD.halfWidth,
      h = FIELD.height,
      d = FIELD.depth;
    this.polygon(
      [
        [-w, 0, -d],
        [w, 0, -d],
        [w, h, -d],
        [-w, h, -d],
      ],
      "#e0e0da90",
    );
    this.polygon(
      [
        [-w, h, 0],
        [w, h, 0],
        [w, h, -d],
        [-w, h, -d],
      ],
      "#f5f5f160",
    );
    this.polygon(
      [
        [w, 0, 0],
        [w, h, 0],
        [w, h, -d],
        [w, 0, -d],
      ],
      "#c9c9c240",
    );
    for (let x = -w; x <= w + 0.01; x += w / 16) {
      const pts = [];
      for (let y = 0; y <= h + 0.01; y += h / 8)
        pts.push(this.netPoint(x, y, -d));
      this.line(pts, "#84847d42", 0.65);
      this.line(
        [
          [x, h, 0],
          [x, h, -d],
        ],
        "#84847d36",
        0.65,
      );
    }
    for (let y = 0; y <= h + 0.01; y += h / 8) {
      const pts = [];
      for (let x = -w; x <= w + 0.01; x += w / 16)
        pts.push(this.netPoint(x, y, -d));
      this.line(pts, "#84847d42", 0.65);
      for (const side of [-1, 1])
        this.line(
          [
            [side * w, y, 0],
            [side * w, y, -d],
          ],
          "#84847d42",
          0.65,
        );
    }
    for (let z = -d; z <= 0; z += d / 5) {
      for (const side of [-1, 1])
        this.line(
          [
            [side * w, 0, z],
            [side * w, h, z],
          ],
          "#84847d38",
          0.65,
        );
    }
    this.line(
      [
        [-w, 0, -d],
        [-w, h, -d],
        [w, h, -d],
        [w, 0, -d],
      ],
      "#6c6c6450",
      1.1,
    );
    for (const side of [-1, 1])
      this.line(
        [
          [side * w, h, 0],
          [side * w, h, -d],
        ],
        "#65655e9c",
        1.5,
      );
    // Cast shadow behind the frame.
    this.polygon(
      [
        [-w, 0, 0],
        [w, 0, 0],
        [w + 1.4, 0, -2.7],
        [-w + 1.4, 0, -2.7],
      ],
      "#44443b0b",
    );
  }
  drawFrame() {
    const w = FIELD.halfWidth,
      h = FIELD.height;
    const width = Math.max(3, this.base * 0.1);
    this.line(
      [
        [-w, 0, 0],
        [-w, h, 0],
        [w, h, 0],
        [w, 0, 0],
      ],
      "#262625",
      width + 1.5,
    );
    this.line(
      [
        [-w - 0.014, 0, 0],
        [-w - 0.014, h + 0.02, 0],
        [w, h + 0.02, 0],
      ],
      "#656561",
      1.2,
    );
  }
  drawKeeper(sample) {
    const c = this.ctx,
      z = 0.12;
    const k = {
      x: sample?.kx ?? (this.reduced ? 0 : Math.sin(this.time * 1.65) * 0.12),
      y: sample?.ky ?? 1.0248 + (this.reduced ? 0 : Math.sin(this.time * 3) * 0.012),
      dive: sample?.dive ?? 0,
      side: sample?.side ?? 1,
    };
    const pose = keeperPose(k),
      d = clamp(k.dive, 0, 1),
      angle = k.side * smooth(d) * 1.1;
    const point = (v) => this.project(v.x, v.y, z);
    const mix = (a, b, u) => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) });
    const shadow = this.project(k.x, 0, z);
    c.fillStyle = "#25251d18";
    c.beginPath();
    c.ellipse(
      shadow.x,
      shadow.y + 2,
      this.base * (0.42 + d * 0.5),
      this.base * 0.055,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    // Tapered limbs make the upper arm, calf and ankle separate volumes.
    const limb = (a, b, r1, r2, colour) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y) || 1,
        nx = -(b.y - a.y) / length,
        ny = (b.x - a.x) / length;
      this.polygon(
        [
          [a.x + nx * r1, a.y + ny * r1, z],
          [b.x + nx * r2, b.y + ny * r2, z],
          [b.x - nx * r2, b.y - ny * r2, z],
          [a.x - nx * r1, a.y - ny * r1, z],
        ],
        colour,
      );
      this.circle3(a.x, a.y, z, r1, colour);
      this.circle3(b.x, b.y, z, r2, colour);
    };
    // Legs: shorts, exposed knees, socks, then shaped boots.
    for (const i of [1, 2]) {
      const hip = pose["hip" + i],
        knee = pose["knee" + i],
        foot = pose["foot" + i];
      limb(hip, knee, 0.105, 0.067, "#97978e");
      limb(knee, foot, 0.074, 0.042, "#9f9f95");
      limb(
        hip,
        mix(hip, knee, 0.59),
        0.117,
        0.1,
        i === 1 ? "#343432" : "#262625",
      );
      limb(mix(knee, foot, 0.32), foot, 0.067, 0.047, "#797970");
      limb(
        mix(knee, foot, 0.31),
        mix(knee, foot, 0.4),
        0.069,
        0.065,
        "#d4d4c8",
      );
      const f = point(foot);
      c.save();
      c.translate(f.x, f.y);
      c.rotate(-angle * 0.35);
      c.fillStyle = "#242423";
      const dir = d > 0.3 ? -k.side : i === 1 ? -1 : 1,
        scale = f.s;
      c.beginPath();
      c.ellipse(
        dir * scale * 0.035,
        0,
        scale * 0.13,
        scale * 0.053,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
      c.strokeStyle = "#bcbcb3";
      c.lineWidth = Math.max(0.6, scale * 0.012);
      c.beginPath();
      c.moveTo(-scale * 0.055, -scale * 0.01);
      c.lineTo(scale * 0.04, -scale * 0.01);
      c.stroke();
      c.restore();
    }
    // The neck and head are separate from the jersey; the head is human-sized.
    limb(pose.shoulder, pose.neck, 0.08, 0.067, "#99998f");
    const head = point(pose.head);
    c.save();
    c.translate(head.x, head.y);
    c.rotate(angle);
    const hs = head.s;
    c.fillStyle = "#a6a69b";
    c.beginPath();
    c.ellipse(0, 0, hs * 0.105, hs * 0.137, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#373735";
    c.beginPath();
    c.ellipse(0, -hs * 0.065, hs * 0.106, hs * 0.075, 0, Math.PI, Math.PI * 2);
    c.lineTo(hs * 0.096, -hs * 0.019);
    c.quadraticCurveTo(0, -hs * 0.062, -hs * 0.095, -hs * 0.018);
    c.closePath();
    c.fill();
    c.strokeStyle = "#64645b";
    c.lineWidth = Math.max(0.55, hs * 0.009);
    c.beginPath();
    c.moveTo(hs * 0.008, -hs * 0.015);
    c.lineTo(hs * 0.018, hs * 0.048);
    c.lineTo(-hs * 0.005, hs * 0.049);
    c.moveTo(-hs * 0.028, hs * 0.085);
    c.lineTo(hs * 0.034, hs * 0.083);
    c.stroke();
    c.fillStyle = "#353533";
    for (const sx of [-1, 1]) {
      c.beginPath();
      c.ellipse(
        sx * hs * 0.041,
        hs * 0.003,
        hs * 0.013,
        hs * 0.008,
        0,
        0,
        Math.PI * 2,
      );
      c.fill();
    }
    c.restore();
    // A broad shoulder line, shaped waist and curved hem instead of a stick torso.
    const body = (dx, dy) => ({
      x: k.x + dx * Math.cos(angle) + dy * Math.sin(angle),
      y: k.y - 0.02 - dx * Math.sin(angle) + dy * Math.cos(angle),
    });
    const outline = [
      body(-0.25, 0.47),
      body(-0.15, 0.57),
      body(-0.075, 0.56),
      body(0, 0.49),
      body(0.075, 0.56),
      body(0.15, 0.57),
      body(0.25, 0.47),
      body(0.18, 0.24),
      body(0.16, -0.045),
      body(0, -0.075),
      body(-0.16, -0.045),
      body(-0.18, 0.24),
    ];
    this.polygon(
      outline.map((p) => [p.x, p.y, z]),
      "#30302e",
    );
    this.polygon(
      [
        body(-0.25, 0.47),
        body(-0.16, 0.3),
        body(-0.16, -0.045),
        body(-0.07, -0.062),
        body(-0.11, 0.37),
      ].map((p) => [p.x, p.y, z]),
      "#454540",
    );
    for (const i of [1, 2]) {
      limb(
        pose["shoulder" + i],
        pose["elbow" + i],
        0.077,
        0.058,
        i === 1 ? "#484843" : "#363633",
      );
      limb(
        pose["elbow" + i],
        pose["hand" + i],
        0.058,
        0.038,
        i === 1 ? "#444440" : "#30302d",
      );
      const cuff = mix(pose["elbow" + i], pose["hand" + i], 0.83);
      limb(cuff, pose["hand" + i], 0.057, 0.06, "#b9b9af");
      const hand = point(pose["hand" + i]),
        elbow = point(pose["elbow" + i]);
      c.save();
      c.translate(hand.x, hand.y);
      c.rotate(Math.atan2(hand.y - elbow.y, hand.x - elbow.x) + Math.PI / 2);
      const gs = hand.s;
      c.fillStyle = "#eeeeE5";
      c.beginPath();
      c.roundRect(-gs * 0.075, -gs * 0.105, gs * 0.15, gs * 0.2, gs * 0.04);
      c.fill();
      c.strokeStyle = "#8c8c82";
      c.lineWidth = Math.max(0.5, gs * 0.009);
      c.beginPath();
      for (const x of [-0.036, 0, 0.036]) {
        c.moveTo(x * gs, -gs * 0.09);
        c.lineTo(x * gs, -gs * 0.025);
      }
      c.moveTo(-gs * 0.06, gs * 0.065);
      c.lineTo(gs * 0.06, gs * 0.065);
      c.stroke();
      c.restore();
    }
    // Quiet kit details still read when the figure is small.
    this.line(
      [body(-0.075, 0.56), body(0, 0.49), body(0.075, 0.56)].map((p) => [
        p.x,
        p.y,
        z,
      ]),
      "#babaae",
      Math.max(0.6, this.base * 0.016),
    );
    const number = point(body(0, 0.23));
    c.save();
    c.translate(number.x, number.y);
    c.rotate(angle);
    c.font = `600 ${this.base * 0.16}px Arial,sans-serif`;
    c.textAlign = "center";
    c.fillStyle = "#cfcfc5";
    c.fillText("1", 0, 0);
    c.restore();
  }
  drawAim() {
    if (!["ready", "charging"].includes(this.phase)) return;
    const c = this.ctx;
    const ax = (this.aim.x / 1000) * FIELD.halfWidth,
      ay = Math.max(0.11, (this.aim.y / 1000) * FIELD.height);
    const p = this.project(ax, ay, 0);
    const r = this.phase === "charging" ? 11 + this.power * 6 : 13;
    c.strokeStyle = "#34342d";
    c.lineWidth = 1;
    c.setLineDash([]);
    c.beginPath();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      c.moveTo(p.x + Math.cos(a) * (r + 4), p.y + Math.sin(a) * (r + 4));
      c.lineTo(p.x + Math.cos(a) * (r - 3), p.y + Math.sin(a) * (r - 3));
    }
    c.stroke();
    c.beginPath();
    c.arc(p.x, p.y, r, 0, Math.PI * 2);
    c.strokeStyle = "#37373166";
    c.stroke();
    c.beginPath();
    c.arc(p.x, p.y, 2, 0, Math.PI * 2);
    c.fillStyle = "#24241f";
    c.fill();
    if (this.phase === "charging") {
      c.beginPath();
      c.arc(
        p.x,
        p.y,
        r + 6,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * this.power,
      );
      c.strokeStyle = "#20201c";
      c.lineWidth = 2;
      c.stroke();
    }
    for (let u = 0.1; u < 0.64; u += 0.1) {
      const q = this.project(
        ax * u,
        lerp(0.11, ay, u) + 0.65 * 4 * u * (1 - u),
        11 * (1 - u),
      );
      c.beginPath();
      c.arc(q.x, q.y, 1.2, 0, Math.PI * 2);
      c.fillStyle = `rgba(35,35,30,${0.1 + (1 - u) * 0.2})`;
      c.fill();
    }
  }
  drawCharge() {
    if (this.phase !== "charging") return;
    const c = this.ctx,
      w = Math.min(150, this.w * 0.4),
      x = (this.w - w) / 2,
      y = this.h * 0.92;
    c.fillStyle = "#00000020";
    c.beginPath();
    c.roundRect(x, y, w, 5, 2.5);
    c.fill();
    c.fillStyle = "#252524";
    c.beginPath();
    c.roundRect(x, y, Math.max(5, w * this.power), 5, 2.5);
    c.fill();
  }
  drawBall(frame) {
    const c = this.ctx;
    const { x, y, z } = frame;
    const p = this.project(x, y, z),
      s = this.project(x, 0.01, z);
    if (z > 19 || z < -14) return;
    const radius = Math.max(4.5, p.s * FIELD.radius * 1.08);
    const altitude = Math.max(0, y - 0.11);
    c.fillStyle = `rgba(20,20,16,${0.19 / (1 + altitude * 0.75)})`;
    c.beginPath();
    c.ellipse(
      s.x,
      s.y + 1,
      radius * (1.05 + altitude * 0.1),
      radius * 0.24,
      0,
      0,
      Math.PI * 2,
    );
    c.fill();
    if (this.motion && this.motionTime > 0.05) {
      const history = this.motion.trajectory;
      const pts = [];
      for (let j = 5; j >= 1; j--) {
        const a = sampleTrajectory(
          history,
          Math.max(0, this.motionTime - j * 0.014),
        );
        pts.push(this.project(a.x, a.y, a.z));
      }
      c.beginPath();
      pts.forEach((a, i) => (i ? c.lineTo(a.x, a.y) : c.moveTo(a.x, a.y)));
      c.lineTo(p.x, p.y);
      c.strokeStyle = "#20201b15";
      c.lineWidth = radius * 0.9;
      c.lineCap = "round";
      c.stroke();
    }
    c.save();
    c.translate(p.x, p.y);
    const grad = c.createRadialGradient(
      -radius * 0.35,
      -radius * 0.4,
      1,
      0,
      0,
      radius,
    );
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.7, "#f4f4ef");
    grad.addColorStop(1, "#a5a59c");
    c.fillStyle = grad;
    c.beginPath();
    c.arc(0, 0, radius, 0, Math.PI * 2);
    c.fill();
    c.clip();
    c.rotate(this.motion ? this.motionTime * (9 + this.power * 10) : -0.4);
    const pent = (px, py, rr) => {
      c.beginPath();
      for (let j = 0; j < 5; j++) {
        const a = (j * 2 * Math.PI) / 5 - Math.PI / 2;
        const xx = px + Math.cos(a) * rr,
          yy = py + Math.sin(a) * rr;
        j ? c.lineTo(xx, yy) : c.moveTo(xx, yy);
      }
      c.closePath();
      c.fillStyle = "#252525";
      c.fill();
    };
    pent(0, 0, radius * 0.42);
    for (let j = 0; j < 5; j++) {
      const a = (j * 2 * Math.PI) / 5 - Math.PI / 2;
      pent(
        Math.cos(a) * radius * 0.98,
        Math.sin(a) * radius * 0.98,
        radius * 0.3,
      );
      c.beginPath();
      c.moveTo(Math.cos(a) * radius * 0.36, Math.sin(a) * radius * 0.36);
      c.lineTo(Math.cos(a) * radius * 0.88, Math.sin(a) * radius * 0.88);
      c.strokeStyle = "#676761";
      c.lineWidth = 0.6;
      c.stroke();
    }
    c.restore();
  }
  drawVerdict() {
    if (!this.verdict) return;
    const c = this.ctx;
    const face = getComputedStyle(this.canvas).getPropertyValue('--font-display').trim() || '"Barlow Condensed", sans-serif';
    c.save();
    c.font = `800 ${Math.min(96, this.w * 0.2)}px ${face}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillStyle = '#1c1c1c';
    c.fillText(this.verdict, this.w / 2, this.h * 0.65, this.w - 32);
    c.restore();
    // Evidence names only a verdict that was drawn, only during its beat.
    this.canvas.dataset.verdict = this.verdict;
  }
  render(time) {
    this.time = time;
    const c = this.ctx;
    c.save();
    if (this.shake > 0 && !this.reduced) {
      c.translate(
        Math.sin(time * 90) * this.shake,
        Math.cos(time * 77) * this.shake * 0.6,
      );
      this.shake *= 0.84;
    }
    this.drawGround();
    this.drawGoalBack();
    let frame = this.motion
      ? sampleTrajectory(this.motion.trajectory, this.motionTime)
      : { x: 0, y: FIELD.radius, z: 11 };
    if (frame.z < 0) this.drawBall(frame);
    this.drawKeeper(this.motion ? frame : null);
    this.drawFrame();
    this.drawAim();
    if (frame.z >= 0) this.drawBall(frame);
    this.drawCharge();
    c.restore();
    this.drawVerdict();
  }
}
