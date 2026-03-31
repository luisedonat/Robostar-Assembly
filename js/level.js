import { COLORS } from './sprites.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './engine.js';

const COLS = Math.floor(GAME_WIDTH / TILE_SIZE);
const ROWS = Math.floor(GAME_HEIGHT / TILE_SIZE);

const FONT = "'Inter', 'Siemens Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace";

function roundRect(ctx, x, y, w, h, r = 6) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ================================================================
   Level 1 -- Blueprint Puzzle  (Design & Engineering)
   Drag robot parts onto the workbench to assemble Robostar.
   ================================================================ */

const PART_SCALE = 0.42;

const PART_DEFS = [
  { key: 'robobody',     label: 'Body',      nw: 207, nh: 261, ox:  0,   oy:  0   },
  { key: 'robohead',     label: 'Head',      nw: 197, nh: 245, ox:  0,   oy: -101 },
  { key: 'roboarm_left', label: 'Left Arm',  nw: 150, nh: 300, ox: -67,  oy:  8   },
  { key: 'roboarm_right',label: 'Right Arm', nw: 125, nh: 300, ox:  62,  oy:  8   },
  { key: 'roboleg',      label: 'Left Leg',  nw: 150, nh: 270, ox: -18,  oy:  112, group: 'leg' },
  { key: 'roboleg_r',    label: 'Right Leg', nw: 150, nh: 270, ox:  18,  oy:  112, group: 'leg' },
];

class BlueprintPuzzleLevel {
  constructor() {
    this.index = 0;
    this.name = 'Design & Engineering';
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._parts = [];
    this._draggingIdx = -1;
    this._dragOffX = 0;
    this._dragOffY = 0;
    this._sprites = null;
  }

  init(_progress) {
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._draggingIdx = -1;

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT * 0.33;

    this._parts = PART_DEFS.map((def) => {
      const pw = def.nw * PART_SCALE;
      const ph = def.nh * PART_SCALE;
      const tx = cx + def.ox - pw / 2;
      const ty = cy + def.oy - ph / 2;

      let sx, sy;
      do {
        sx = 10 + Math.random() * (GAME_WIDTH - pw - 20);
        sy = GAME_HEIGHT * 0.58 + Math.random() * (GAME_HEIGHT * 0.32 - ph);
      } while (Math.abs(sx - tx) < 30 && Math.abs(sy - ty) < 30);

      return {
        key: def.key,
        label: def.label,
        group: def.group || null,
        w: pw,
        h: ph,
        x: sx,
        y: sy,
        targetX: tx,
        targetY: ty,
        placed: false,
      };
    });

    for (let i = this._parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._parts[i], this._parts[j]] = [this._parts[j], this._parts[i]];
    }
  }

  update(dt, input) {
    if (!this._started && (input.pointerDown || input.isDragging)) {
      this._started = true;
    }
    if (this._started && !this.completed) {
      this.timerMs += dt * 1000;
    }

    if (input.pointerDown && this._draggingIdx === -1) {
      const px = input.pointerX;
      const py = input.pointerY;
      for (let i = this._parts.length - 1; i >= 0; i--) {
        const p = this._parts[i];
        if (p.placed) continue;
        if (px >= p.x && px <= p.x + p.w && py >= p.y && py <= p.y + p.h) {
          this._draggingIdx = i;
          this._dragOffX = px - p.x;
          this._dragOffY = py - p.y;
          const part = this._parts.splice(i, 1)[0];
          this._parts.push(part);
          this._draggingIdx = this._parts.length - 1;
          break;
        }
      }
    }

    if (this._draggingIdx >= 0 && input.pointerDown) {
      const p = this._parts[this._draggingIdx];
      p.x = input.pointerX - this._dragOffX;
      p.y = input.pointerY - this._dragOffY;
    }

    const dropInfo = input.consumeDragEnd();
    if (dropInfo && this._draggingIdx >= 0) {
      const p = this._parts[this._draggingIdx];

      const candidates = [{ x: p.targetX, y: p.targetY }];
      if (p.group) {
        for (const other of this._parts) {
          if (other === p || other.group !== p.group) continue;
          candidates.push({ x: other.targetX, y: other.targetY });
        }
      }

      let snapX = null, snapY = null, bestDist = 35;
      for (const t of candidates) {
        const occupied = this._parts.some(q => q !== p && q.placed &&
          Math.abs(q.x - t.x) < 2 && Math.abs(q.y - t.y) < 2);
        if (occupied) continue;
        const d = Math.hypot(p.x - t.x, p.y - t.y);
        if (d < bestDist) {
          bestDist = d;
          snapX = t.x;
          snapY = t.y;
        }
      }

      if (snapX !== null) {
        p.x = snapX;
        p.y = snapY;
        p.placed = true;
      }

      this._draggingIdx = -1;
    }

    if (!input.pointerDown && this._draggingIdx >= 0) {
      this._draggingIdx = -1;
    }

    if (this._parts.length > 0 && this._parts.every(p => p.placed)) {
      this.completed = true;
    }
  }

  render(ctx, sprites) {
    this._sprites = sprites;
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Workbench panel with rounded corners
    ctx.save();
    roundRect(ctx, 14, GAME_HEIGHT * 0.08, GAME_WIDTH - 28, GAME_HEIGHT * 0.48, 12);
    ctx.fillStyle = COLORS.darkPanel;
    ctx.fill();
    ctx.strokeStyle = COLORS.teal + '80';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = `700 14px ${FONT}`;
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('VIRTUAL WORKBENCH', GAME_WIDTH / 2, GAME_HEIGHT * 0.08 + 16);
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.fillText('NX / Simcenter / Teamcenter', GAME_WIDTH / 2, GAME_HEIGHT * 0.08 + 34);
    ctx.restore();

    for (const p of this._parts) {
      if (p.placed) continue;
      ctx.save();
      ctx.globalAlpha = 0.2;
      this._drawPart(ctx, sprites, p.key, p.targetX, p.targetY, p.w, p.h);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    for (const p of this._parts) {
      if (p.placed) {
        ctx.save();
        ctx.shadowColor = COLORS.petrol;
        ctx.shadowBlur = 12;
        this._drawPart(ctx, sprites, p.key, p.x, p.y, p.w, p.h);
        ctx.restore();
      }
    }

    for (const p of this._parts) {
      if (!p.placed) {
        this._drawPart(ctx, sprites, p.key, p.x, p.y, p.w, p.h);
      }
    }

    const placed = this._parts.filter(p => p.placed).length;
    ctx.save();
    ctx.font = `600 14px ${FONT}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${placed} / ${this._parts.length} parts placed`, GAME_WIDTH / 2, GAME_HEIGHT - 34);
    ctx.restore();
  }

  _drawPart(ctx, sprites, key, x, y, w, h) {
    const imgKey = key === 'roboleg_r' ? 'roboleg' : key;
    if (!sprites.drawImage(ctx, imgKey, x, y, w, h)) {
      ctx.fillStyle = COLORS.midPanel;
      ctx.fillRect(x, y, w, h);
    }
  }

  isComplete() { return this.completed; }
}

/* ================================================================
   Level 2 -- Doodle Jump  (Manufacturing)
   Jump from platform to platform using robotFullFront.png.
   ================================================================ */

const PLATFORM_COUNT = 35;
const PLATFORM_SPACING = 55;
const BREAKABLE_CHANCE = 0.25;
const SPRING_CHANCE = 0.15;

class DoodleJumpLevel {
  constructor() {
    this.index = 1;
    this.name = 'Manufacturing';
    this.completed = false;
    this.timerMs = 0;
    this._started = false;

    this._playerX = 0;
    this._playerY = 0;
    this._playerVX = 0;
    this._playerVY = 0;
    this._playerW = 60;
    this._playerH = 66;

    this._platforms = [];
    this._scrollY = 0;
    this._maxReached = 0;
    this._finishWorldY = 0;
    this._targetHeight = 0;
    this._gravity = 600;
    this._bounceVel = -390;
    this._moveSpeed = 160;
    this._dead = false;
    this._swipeMomentum = 0;
    this._swipeTimer = 0;

    // Factory background elements
    this._bgElements = [];
  }

  _generateBackground() {
    this._bgElements = [];
    const totalHeight = Math.abs(this._finishWorldY) + GAME_HEIGHT + 200;
    const seed = 42;
    let rng = seed;
    const rand = () => { rng = (rng * 1664525 + 1013904223) & 0x7fffffff; return rng / 0x7fffffff; };

    // Gears — scattered throughout
    for (let i = 0; i < 18; i++) {
      this._bgElements.push({
        type: 'gear',
        x: rand() * GAME_WIDTH,
        worldY: GAME_HEIGHT - rand() * totalHeight,
        radius: 18 + rand() * 28,
        teeth: Math.floor(6 + rand() * 6),
        rotation: rand() * Math.PI * 2,
        speed: (rand() - 0.5) * 0.4,
        alpha: 0.06 + rand() * 0.06,
      });
    }

    // Horizontal pipes
    for (let i = 0; i < 12; i++) {
      const pipeY = GAME_HEIGHT - 100 - i * (totalHeight / 12) + rand() * 60;
      const fromLeft = rand() > 0.5;
      this._bgElements.push({
        type: 'pipe',
        x: fromLeft ? 0 : GAME_WIDTH * 0.55,
        worldY: pipeY,
        w: GAME_WIDTH * (0.2 + rand() * 0.3),
        h: 6 + rand() * 4,
        alpha: 0.08 + rand() * 0.06,
      });
    }

    // Girder / I-beam cross-braces
    for (let i = 0; i < 8; i++) {
      this._bgElements.push({
        type: 'girder',
        x: rand() * GAME_WIDTH * 0.6 + GAME_WIDTH * 0.2,
        worldY: GAME_HEIGHT - 200 - rand() * (totalHeight - 200),
        w: 30 + rand() * 50,
        angle: (rand() - 0.5) * 0.5,
        alpha: 0.05 + rand() * 0.05,
      });
    }

    // Small bolts / rivets
    for (let i = 0; i < 30; i++) {
      this._bgElements.push({
        type: 'bolt',
        x: rand() * GAME_WIDTH,
        worldY: GAME_HEIGHT - rand() * totalHeight,
        alpha: 0.08 + rand() * 0.07,
      });
    }

    // Hazard stripes (at walls)
    for (let i = 0; i < 6; i++) {
      const stripeY = GAME_HEIGHT - 300 - i * (totalHeight / 6);
      this._bgElements.push({
        type: 'hazard',
        x: rand() > 0.5 ? 0 : GAME_WIDTH - 14,
        worldY: stripeY,
        h: 40 + rand() * 60,
        alpha: 0.06 + rand() * 0.04,
      });
    }
  }

  _drawBackground(ctx, scrollY, time) {
    // Subtle grid pattern
    ctx.save();
    ctx.strokeStyle = COLORS.darkPanel + '30';
    ctx.lineWidth = 0.5;
    const gridSize = 40;
    const offsetY = (scrollY * 0.3) % gridSize;
    for (let y = -gridSize + offsetY; y < GAME_HEIGHT + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_WIDTH, y);
      ctx.stroke();
    }
    const offsetX = 0;
    for (let x = offsetX; x < GAME_WIDTH; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_HEIGHT);
      ctx.stroke();
    }
    ctx.restore();

    for (const el of this._bgElements) {
      const screenY = el.worldY + scrollY;

      // Cull off-screen
      if (el.type !== 'pipe' && el.type !== 'hazard') {
        if (screenY < -80 || screenY > GAME_HEIGHT + 80) continue;
      } else {
        if (screenY < -120 || screenY > GAME_HEIGHT + 120) continue;
      }

      ctx.save();
      ctx.globalAlpha = el.alpha;

      if (el.type === 'gear') {
        this._drawGear(ctx, el.x, screenY, el.radius, el.teeth, el.rotation + time * el.speed);
      } else if (el.type === 'pipe') {
        this._drawPipe(ctx, el.x, screenY, el.w, el.h);
      } else if (el.type === 'girder') {
        this._drawGirder(ctx, el.x, screenY, el.w, el.angle);
      } else if (el.type === 'bolt') {
        this._drawBolt(ctx, el.x, screenY);
      } else if (el.type === 'hazard') {
        this._drawHazardStripe(ctx, el.x, screenY, el.h);
      }

      ctx.restore();
    }
  }

  _drawGear(ctx, cx, cy, r, teeth, angle) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.strokeStyle = COLORS.midPanel;
    ctx.lineWidth = 2;

    // Outer teeth
    ctx.beginPath();
    const toothDepth = r * 0.22;
    const step = (Math.PI * 2) / (teeth * 2);
    for (let i = 0; i < teeth * 2; i++) {
      const rad = i % 2 === 0 ? r : r - toothDepth;
      const a = i * step;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();

    // Center hub
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Spokes
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25);
      ctx.lineTo(Math.cos(a) * (r - toothDepth - 2), Math.sin(a) * (r - toothDepth - 2));
      ctx.stroke();
    }

    ctx.restore();
  }

  _drawPipe(ctx, x, y, w, h) {
    ctx.fillStyle = COLORS.midPanel;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = COLORS.teal;
    roundRect(ctx, x, y, w, h * 0.4, h * 0.2);
    ctx.fill();

    // Pipe joints
    const jointW = h + 4;
    const jointH = h + 4;
    roundRect(ctx, x - 2, y - 2, jointW, jointH, 2);
    ctx.fillStyle = COLORS.midPanel;
    ctx.fill();
    roundRect(ctx, x + w - jointW + 2, y - 2, jointW, jointH, 2);
    ctx.fill();
  }

  _drawGirder(ctx, x, y, w, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = COLORS.teal;
    ctx.lineWidth = 1.5;

    // I-beam cross section
    const h = 8;
    ctx.strokeRect(-w / 2, -h / 2, w, h);
    // Cross hatching
    const step = 10;
    for (let i = -w / 2; i < w / 2; i += step) {
      ctx.beginPath();
      ctx.moveTo(i, -h / 2);
      ctx.lineTo(i + step, h / 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawBolt(ctx, x, y) {
    ctx.strokeStyle = COLORS.midPanel;
    ctx.lineWidth = 1;
    // Hexagonal bolt head
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
      const bx = x + Math.cos(a) * 4;
      const by = y + Math.sin(a) * 4;
      if (i === 0) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.closePath();
    ctx.stroke();
    // Center dot
    ctx.fillStyle = COLORS.midPanel;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawHazardStripe(ctx, x, y, h) {
    const w = 14;
    const stripeH = 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    for (let sy = y; sy < y + h + stripeH * 2; sy += stripeH * 2) {
      ctx.fillStyle = COLORS.yellow;
      ctx.beginPath();
      ctx.moveTo(x, sy);
      ctx.lineTo(x + w, sy - stripeH);
      ctx.lineTo(x + w, sy - stripeH + stripeH);
      ctx.lineTo(x, sy + stripeH);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  init(_progress) {
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._dead = false;
    this._scrollY = 0;
    this._maxReached = 0;
    this._swipeMomentum = 0;
    this._swipeTimer = 0;

    this._playerX = GAME_WIDTH / 2 - this._playerW / 2;
    this._playerY = GAME_HEIGHT - 120;
    this._playerVX = 0;
    this._playerVY = 0;

    this._platforms = [];
    const wallMargin = 10;

    this._platforms.push({
      x: 0,
      y: GAME_HEIGHT - 60,
      w: GAME_WIDTH,
      breakable: false,
      broken: false,
      spring: false,
    });

    for (let i = 1; i <= PLATFORM_COUNT; i++) {
      const isBreakable = i > 3 && Math.random() < BREAKABLE_CHANCE;
      const hasSpring = !isBreakable && i > 2 && Math.random() < SPRING_CHANCE;
      const w = 50 + Math.random() * 30;
      this._platforms.push({
        x: wallMargin + Math.random() * (GAME_WIDTH - 2 * wallMargin - w),
        y: GAME_HEIGHT - 60 - i * PLATFORM_SPACING,
        w,
        breakable: isBreakable,
        broken: false,
        spring: hasSpring,
      });
    }

    this._finishWorldY = GAME_HEIGHT - 60 - PLATFORM_COUNT * PLATFORM_SPACING - 50;
    this._targetHeight = (GAME_HEIGHT * 0.35) - this._finishWorldY;
    this._bgTime = 0;
    this._generateBackground();
  }

  update(dt, input) {
    this._bgTime += dt;

    if (this._dead) {
      if (input.consumeTap()) {
        this.init(null);
      }
      return;
    }

    if (!this._started && (input.pointerDown || input.keys.left || input.keys.right || input.keys.up)) {
      this._started = true;
    }
    if (this._started && !this.completed) {
      this.timerMs += dt * 1000;
    }

    if (input.pointerDown) {
      this._playerX = input.pointerX - this._playerW / 2;
      this._playerVX = 0;
    } else if (input.keys.left) {
      this._playerVX = -this._moveSpeed;
    } else if (input.keys.right) {
      this._playerVX = this._moveSpeed;
    } else {
      this._playerVX = 0;
    }

    this._playerVY += this._gravity * dt;
    this._playerX += this._playerVX * dt;
    this._playerY += this._playerVY * dt;

    if (this._playerX < -this._playerW) this._playerX = GAME_WIDTH;
    if (this._playerX > GAME_WIDTH) this._playerX = -this._playerW;

    if (this._playerVY > 0) {
      for (const plat of this._platforms) {
        if (plat.broken) continue;
        const py = plat.y + this._scrollY;
        if (
          this._playerX + this._playerW > plat.x &&
          this._playerX < plat.x + plat.w &&
          this._playerY + this._playerH >= py &&
          this._playerY + this._playerH <= py + 14
        ) {
          this._playerVY = plat.spring ? this._bounceVel * 2 : this._bounceVel;
          this._playerY = py - this._playerH;
          if (plat.breakable) {
            plat.broken = true;
          }
        }
      }
    }

    if (this._playerY < GAME_HEIGHT * 0.35) {
      const shift = GAME_HEIGHT * 0.35 - this._playerY;
      this._playerY = GAME_HEIGHT * 0.35;
      this._scrollY += shift;
    }

    if (this._scrollY > this._maxReached) {
      this._maxReached = this._scrollY;
    }

    if (this._playerY > GAME_HEIGHT + 50) {
      this._dead = true;
    }

    const playerWorldTop = this._playerY - this._scrollY;
    if (playerWorldTop <= this._finishWorldY) {
      this.completed = true;
    }
  }

  render(ctx, sprites) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Factory background
    this._drawBackground(ctx, this._scrollY, this._bgTime);

    for (const plat of this._platforms) {
      if (plat.broken) continue;
      const py = plat.y + this._scrollY;
      if (py < -20 || py > GAME_HEIGHT + 20) continue;

      if (plat.breakable) {
        ctx.save();
        roundRect(ctx, plat.x, py, plat.w, 8, 4);
        ctx.fillStyle = COLORS.red;
        ctx.fill();
        // Highlight stripe
        roundRect(ctx, plat.x, py, plat.w, 3, 4);
        ctx.fillStyle = '#FF6666';
        ctx.fill();
        ctx.restore();
      } else {
        ctx.save();
        roundRect(ctx, plat.x, py, plat.w, 8, 4);
        ctx.fillStyle = COLORS.petrol;
        ctx.fill();
        // Highlight stripe
        roundRect(ctx, plat.x, py, plat.w, 3, 4);
        ctx.fillStyle = COLORS.lightPetrol;
        ctx.fill();
        ctx.restore();

        if (plat.spring) {
          const sx = plat.x + plat.w / 2;
          const coilW = 6;
          const coilH = 14;
          ctx.strokeStyle = COLORS.yellow;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(sx, py);
          ctx.lineTo(sx - coilW, py - coilH * 0.33);
          ctx.lineTo(sx + coilW, py - coilH * 0.66);
          ctx.lineTo(sx, py - coilH);
          ctx.stroke();
          ctx.fillStyle = COLORS.yellowBright;
          ctx.beginPath();
          ctx.arc(sx, py - coilH, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    const finishScreenY = this._finishWorldY + this._scrollY;
    if (finishScreenY > -40 && finishScreenY < GAME_HEIGHT + 40) {
      ctx.save();
      ctx.fillStyle = COLORS.yellow;
      roundRect(ctx, 0, finishScreenY, GAME_WIDTH, 4, 2);
      ctx.fill();
      ctx.font = `700 15px ${FONT}`;
      ctx.fillStyle = COLORS.yellow;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('FINISH', GAME_WIDTH / 2, finishScreenY - 6);
      ctx.restore();
    }

    const px = Math.round(this._playerX);
    const py = Math.round(this._playerY);
    const img = sprites.getImage('robotFullFront');
    if (img) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      const ratio = img.naturalWidth / img.naturalHeight;
      const drawW = this._playerH * ratio;
      const drawX = px + (this._playerW - drawW) / 2;
      sprites.drawImage(ctx, 'robotFullFront', drawX, py, drawW, this._playerH);
      ctx.restore();
    } else {
      ctx.save();
      roundRect(ctx, px, py, this._playerW, this._playerH, 8);
      ctx.fillStyle = COLORS.petrol;
      ctx.fill();
      ctx.restore();
    }

    // Progress bar — rounded
    ctx.save();
    roundRect(ctx, 4, 56, 8, GAME_HEIGHT - 96, 4);
    ctx.fillStyle = COLORS.darkPanel;
    ctx.fill();
    const progressPct = Math.min(this._maxReached / this._targetHeight, 1);
    const barH = (GAME_HEIGHT - 96) * progressPct;
    if (barH > 0) {
      roundRect(ctx, 4, 56 + (GAME_HEIGHT - 96) - barH, 8, barH, 4);
      ctx.fillStyle = COLORS.yellow;
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('SINUMERIK / Opcenter', GAME_WIDTH / 2, GAME_HEIGHT - 8);
    ctx.restore();

    if (this._dead) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,40,0.75)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Death card
      roundRect(ctx, 60, GAME_HEIGHT / 2 - 60, GAME_WIDTH - 120, 120, 16);
      ctx.fillStyle = COLORS.darkPanel + 'E0';
      ctx.fill();
      ctx.strokeStyle = COLORS.red + '60';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = `800 26px ${FONT}`;
      ctx.fillStyle = COLORS.red;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FELL DOWN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 16);
      ctx.font = `500 15px ${FONT}`;
      ctx.fillStyle = COLORS.coral;
      ctx.fillText('Tap to retry', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 24);
      ctx.restore();
    }
  }

  isComplete() { return this.completed; }
}

/* ================================================================
   Level 3 -- Code Puzzle  (Software & Deployment)
   Drag code statements into the correct sequence in an IDE-style editor.
   ================================================================ */

const CODE_BLOCKS = [
  { label: 'robot.init()',      keyword: 'await',  color: '#C586C0', hint: 'initialize the robot' },
  { label: 'sensor.scan()',     keyword: 'await',  color: '#C586C0', hint: 'scan the environment' },
  { label: 'target.detect()',   keyword: 'const',  color: '#569CD6', hint: 'identify the target' },
  { label: 'arm.grab(target)',  keyword: 'await',  color: '#C586C0', hint: 'pick up the target' },
  { label: 'arm.move(dest)',    keyword: 'await',  color: '#C586C0', hint: 'move to destination' },
  { label: 'robot.deploy()',    keyword: 'return', color: '#C586C0', hint: 'deploy & finish' },
];

const BLOCK_W = 220;
const BLOCK_H = 34;
const SLOT_GAP = 4;

// IDE color palette (VS Code dark theme inspired, using Siemens IX accents)
const IDE = {
  editorBg:    '#1E1E3A',    // slightly navy-tinted
  gutterBg:    '#191932',
  lineNum:     '#5A5A7A',
  tabBg:       '#2D2D4A',
  tabActive:   '#1E1E3A',
  tabBorder:   '#009999',   // petrol accent
  keyword:     '#C586C0',
  func:        '#DCDCAA',
  string:      '#CE9178',
  comment:     '#6A9955',
  bracket:     '#FFD700',
  text:        '#D4D4D4',
  selection:   '#264F78',
  cursor:      '#AEAFAD',
};

class CodePuzzleLevel {
  constructor() {
    this.index = 2;
    this.name = 'Software & Deployment';
    this.completed = false;
    this.timerMs = 0;
    this._started = false;

    this._slots = [];
    this._blocks = [];
    this._draggingIdx = -1;
    this._dragOffX = 0;
    this._dragOffY = 0;
    this._cursorBlink = 0;
  }

  init(_progress) {
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._draggingIdx = -1;
    this._cursorBlink = 0;

    // Editor area: slots sit inside the "code editor" region
    const editorLeft = 52;  // after gutter
    const editorRight = GAME_WIDTH - 16;
    const slotW = editorRight - editorLeft - 8;
    const slotStartY = 178;  // after header/tabs/function line

    this._slots = CODE_BLOCKS.map((def, i) => ({
      label: def.label,
      keyword: def.keyword,
      color: def.color,
      hint: def.hint,
      x: editorLeft + 4,
      y: slotStartY + i * (BLOCK_H + SLOT_GAP),
      w: slotW,
      filled: false,
      filledLabel: null,
    }));

    // Shuffle blocks for the tray
    const shuffled = CODE_BLOCKS.map((def, i) => ({ ...def, origIdx: i }));
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const trayStartY = GAME_HEIGHT * 0.56;
    const trayLeft = 20;
    const trayW = GAME_WIDTH - 40;
    const cols = 2;
    const cellW = (trayW - SLOT_GAP) / cols;

    this._blocks = shuffled.map((def, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const bx = trayLeft + col * (cellW + SLOT_GAP);
      const by = trayStartY + row * (BLOCK_H + SLOT_GAP + 4);
      return {
        label: def.label,
        keyword: def.keyword,
        color: def.color,
        x: bx,
        y: by,
        homeX: bx,
        homeY: by,
        w: cellW,
        placed: false,
        slotIdx: -1,
      };
    });
  }

  update(dt, input) {
    this._cursorBlink += dt;
    if (!this._started && (input.pointerDown || input.isDragging)) {
      this._started = true;
    }
    if (this._started && !this.completed) {
      this.timerMs += dt * 1000;
    }

    if (input.pointerDown && this._draggingIdx === -1) {
      const px = input.pointerX;
      const py = input.pointerY;
      for (let i = this._blocks.length - 1; i >= 0; i--) {
        const b = this._blocks[i];
        if (b.placed) continue;
        if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + BLOCK_H) {
          this._draggingIdx = i;
          this._dragOffX = px - b.x;
          this._dragOffY = py - b.y;
          break;
        }
      }
    }

    if (this._draggingIdx >= 0 && input.pointerDown) {
      const b = this._blocks[this._draggingIdx];
      b.x = input.pointerX - this._dragOffX;
      b.y = input.pointerY - this._dragOffY;
    }

    const dropInfo = input.consumeDragEnd();
    if (dropInfo && this._draggingIdx >= 0) {
      const b = this._blocks[this._draggingIdx];
      let snapped = false;

      // Find the closest unfilled slot by vertical overlap
      let bestSlot = -1;
      let bestDist = Infinity;
      const bCenterY = b.y + BLOCK_H / 2;

      for (let si = 0; si < this._slots.length; si++) {
        const s = this._slots[si];
        if (s.filled) continue;
        const sCenterY = s.y + BLOCK_H / 2;
        const dy = Math.abs(bCenterY - sCenterY);
        // Accept if the block's vertical center is within the slot's row
        // (generous: within BLOCK_H * 1.5 of the slot center)
        if (dy < BLOCK_H * 1.5 && dy < bestDist) {
          bestDist = dy;
          bestSlot = si;
        }
      }

      if (bestSlot >= 0) {
        const s = this._slots[bestSlot];
        if (s.label === b.label) {
          // Correct — snap into place
          b.x = s.x;
          b.y = s.y;
          b.placed = true;
          b.slotIdx = bestSlot;
          s.filled = true;
          s.filledLabel = b.label;
          snapped = true;
        } else {
          // Wrong slot — bounce back
          b.x = b.homeX;
          b.y = b.homeY;
          snapped = true;
        }
      }

      if (!snapped) {
        b.x = b.homeX;
        b.y = b.homeY;
      }

      this._draggingIdx = -1;
    }

    if (!input.pointerDown && this._draggingIdx >= 0) {
      const b = this._blocks[this._draggingIdx];
      b.x = b.homeX;
      b.y = b.homeY;
      this._draggingIdx = -1;
    }

    if (this._blocks.length > 0 && this._blocks.every(b => b.placed)) {
      this.completed = true;
    }
  }

  render(ctx, _sprites) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const editorTop = 56;
    const editorLeft = 0;
    const editorW = GAME_WIDTH;
    const editorH = GAME_HEIGHT * 0.5;
    const gutterW = 48;

    // ── Editor tab bar ──
    ctx.save();
    ctx.fillStyle = IDE.tabBg;
    ctx.fillRect(editorLeft, editorTop, editorW, 28);
    // Active tab
    roundRect(ctx, editorLeft + 4, editorTop + 2, 130, 24, 4);
    ctx.fillStyle = IDE.tabActive;
    ctx.fill();
    // Tab accent bar
    ctx.fillStyle = IDE.tabBorder;
    ctx.fillRect(editorLeft + 4, editorTop + 2, 130, 2);
    // Tab label
    ctx.font = `500 11px ${MONO}`;
    ctx.fillStyle = IDE.text;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('robostar_ai.ts', editorLeft + 14, editorTop + 15);
    // Second tab (inactive)
    ctx.fillStyle = IDE.lineNum;
    ctx.fillText('config.json', editorLeft + 145, editorTop + 15);
    ctx.restore();

    const codeTop = editorTop + 28;

    // ── Editor background ──
    ctx.save();
    ctx.fillStyle = IDE.editorBg;
    ctx.fillRect(editorLeft, codeTop, editorW, editorH);
    // Gutter
    ctx.fillStyle = IDE.gutterBg;
    ctx.fillRect(editorLeft, codeTop, gutterW, editorH);
    // Gutter separator line
    ctx.strokeStyle = IDE.lineNum + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(editorLeft + gutterW, codeTop);
    ctx.lineTo(editorLeft + gutterW, codeTop + editorH);
    ctx.stroke();
    ctx.restore();

    // ── Static code lines (above the slots) ──
    const lineH = BLOCK_H + SLOT_GAP;
    let lineY = codeTop + 8;

    // Line 1: comment
    this._drawGutterLine(ctx, editorLeft, lineY, gutterW, 1);
    ctx.save();
    ctx.font = `400 12px ${MONO}`;
    ctx.fillStyle = IDE.comment;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('// Robostar AI sequence', editorLeft + gutterW + 10, lineY + 2);
    ctx.restore();
    lineY += 20;

    // Line 2: async function header
    this._drawGutterLine(ctx, editorLeft, lineY, gutterW, 2);
    ctx.save();
    ctx.font = `400 12px ${MONO}`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    // "async" keyword
    ctx.fillStyle = IDE.keyword;
    ctx.fillText('async', editorLeft + gutterW + 10, lineY + 2);
    // "function" keyword
    ctx.fillStyle = '#569CD6';
    ctx.fillText('function', editorLeft + gutterW + 52, lineY + 2);
    // function name
    ctx.fillStyle = IDE.func;
    ctx.fillText('deploy', editorLeft + gutterW + 118, lineY + 2);
    // bracket
    ctx.fillStyle = IDE.bracket;
    ctx.fillText('() {', editorLeft + gutterW + 160, lineY + 2);
    ctx.restore();
    lineY += 24;

    // ── Slot area (the drop zones inside the editor) ──
    const slotStartLine = 3;
    for (let i = 0; i < this._slots.length; i++) {
      const s = this._slots[i];
      const ln = slotStartLine + i;

      // Line number in gutter
      this._drawGutterLine(ctx, editorLeft, s.y, gutterW, ln);

      // Indent guide
      ctx.save();
      ctx.strokeStyle = IDE.lineNum + '30';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(editorLeft + gutterW + 14, s.y);
      ctx.lineTo(editorLeft + gutterW + 14, s.y + BLOCK_H);
      ctx.stroke();
      ctx.restore();

      if (!s.filled) {
        // Empty slot — dashed outline resembling a code placeholder
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = IDE.lineNum + '60';
        ctx.lineWidth = 1;
        roundRect(ctx, s.x, s.y, s.w, BLOCK_H, 4);
        ctx.stroke();
        ctx.setLineDash([]);

        // Placeholder text — hint for what this step does
        ctx.font = `400 11px ${MONO}`;
        ctx.fillStyle = IDE.lineNum + '90';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(`  // ${s.hint}`, s.x + 6, s.y + BLOCK_H / 2);
        ctx.restore();
      }
    }

    // ── Closing brace ──
    const lastSlot = this._slots[this._slots.length - 1];
    const closingY = lastSlot.y + BLOCK_H + 8;
    this._drawGutterLine(ctx, editorLeft, closingY, gutterW, slotStartLine + this._slots.length);
    ctx.save();
    ctx.font = `400 12px ${MONO}`;
    ctx.fillStyle = IDE.bracket;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText('}', editorLeft + gutterW + 10, closingY + 2);
    ctx.restore();

    // ── Blinking cursor ──
    const cursorVisible = Math.sin(this._cursorBlink * 3) > 0;
    if (cursorVisible) {
      // Find the first unfilled slot
      const nextEmpty = this._slots.find(s => !s.filled);
      if (nextEmpty) {
        ctx.save();
        ctx.fillStyle = IDE.cursor;
        ctx.fillRect(nextEmpty.x + 4, nextEmpty.y + 5, 1.5, BLOCK_H - 10);
        ctx.restore();
      }
    }

    // ── Placed blocks (rendered inside editor slots) ──
    for (const b of this._blocks) {
      if (b.placed) {
        this._drawCodeBlock(ctx, b, b.x, b.y, this._slots[0].w, false, false);
      }
    }

    // ── Bottom editor status bar ──
    const statusY = codeTop + editorH;
    ctx.save();
    ctx.fillStyle = COLORS.petrol;
    ctx.fillRect(editorLeft, statusY, editorW, 22);
    ctx.font = `500 10px ${MONO}`;
    ctx.fillStyle = COLORS.white;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('TypeScript', editorLeft + 10, statusY + 11);
    ctx.textAlign = 'right';
    const placed = this._blocks.filter(b => b.placed).length;
    ctx.fillText(`${placed}/${this._blocks.length} lines · UTF-8`, editorLeft + editorW - 10, statusY + 11);
    ctx.restore();

    // ── Instruction text ──
    ctx.save();
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Drag code blocks into the editor', GAME_WIDTH / 2, statusY + 32);
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.fillText('Industrial Edge / Xcelerator', GAME_WIDTH / 2, statusY + 50);
    ctx.restore();

    // ── Tray area: code blocks to drag ──
    for (let i = 0; i < this._blocks.length; i++) {
      const b = this._blocks[i];
      if (b.placed) continue;
      const isDragged = i === this._draggingIdx;
      this._drawCodeBlock(ctx, b, b.x, b.y, b.w, isDragged, true);
    }

    // ── Progress counter ──
    ctx.save();
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`${placed} / ${this._blocks.length} lines completed`, GAME_WIDTH / 2, GAME_HEIGHT - 34);
    ctx.restore();
  }

  _drawGutterLine(ctx, editorLeft, y, gutterW, lineNum) {
    ctx.save();
    ctx.font = `400 11px ${MONO}`;
    ctx.fillStyle = IDE.lineNum;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(String(lineNum), editorLeft + gutterW - 10, y + 3);
    ctx.restore();
  }

  _drawCodeBlock(ctx, b, x, y, w, isDragged, isTray) {
    ctx.save();

    // Block background
    if (isDragged) {
      // Elevated drag state
      ctx.shadowColor = COLORS.focusBlue + '60';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 4;
    }

    roundRect(ctx, x, y, w, BLOCK_H, 4);
    if (isTray) {
      ctx.fillStyle = isDragged ? COLORS.focusBlue + '30' : IDE.editorBg;
    } else {
      ctx.fillStyle = IDE.selection + '60';
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = isDragged ? COLORS.focusBlue : IDE.lineNum + '40';
    ctx.lineWidth = isDragged ? 1.5 : 1;
    ctx.stroke();

    ctx.restore();

    // Syntax-highlighted code text
    ctx.save();
    ctx.font = `400 12px ${MONO}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    const textY = y + BLOCK_H / 2;
    let textX = x + 10;

    // Keyword
    ctx.fillStyle = b.color || IDE.keyword;
    ctx.fillText(b.keyword, textX, textY);
    textX += ctx.measureText(b.keyword).width + 6;

    // Function call / statement — split on '(' to colorize
    const parts = b.label.split('(');
    // Object.method part
    const dotParts = parts[0].split('.');
    if (dotParts.length === 2) {
      ctx.fillStyle = IDE.text;
      ctx.fillText(dotParts[0] + '.', textX, textY);
      textX += ctx.measureText(dotParts[0] + '.').width;
      ctx.fillStyle = IDE.func;
      ctx.fillText(dotParts[1], textX, textY);
      textX += ctx.measureText(dotParts[1]).width;
    } else {
      ctx.fillStyle = IDE.func;
      ctx.fillText(parts[0], textX, textY);
      textX += ctx.measureText(parts[0]).width;
    }

    // Parentheses and args
    if (parts.length > 1) {
      ctx.fillStyle = IDE.bracket;
      ctx.fillText('(', textX, textY);
      textX += ctx.measureText('(').width;
      const inner = parts[1].replace(')', '');
      if (inner) {
        ctx.fillStyle = inner.startsWith("'") ? IDE.string : IDE.text;
        ctx.fillText(inner, textX, textY);
        textX += ctx.measureText(inner).width;
      }
      ctx.fillStyle = IDE.bracket;
      ctx.fillText(')', textX, textY);
      textX += ctx.measureText(')').width;
    }

    // Semicolon
    ctx.fillStyle = IDE.text;
    ctx.fillText(';', textX, textY);

    ctx.restore();
  }

  isComplete() { return this.completed; }
}

/* ---- Level Registry ---- */

const LEVEL_FACTORIES = [
  () => new BlueprintPuzzleLevel(),
  () => new DoodleJumpLevel(),
  () => new CodePuzzleLevel(),
];

export function createLevel(index) {
  if (index < 0 || index >= LEVEL_FACTORIES.length) return null;
  return LEVEL_FACTORIES[index]();
}

export { COLS, ROWS };
