import { COLORS } from './sprites.js';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from './engine.js';

const COLS = Math.floor(GAME_WIDTH / TILE_SIZE);
const ROWS = Math.floor(GAME_HEIGHT / TILE_SIZE);

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

    ctx.fillStyle = COLORS.darkPanel;
    ctx.fillRect(10, GAME_HEIGHT * 0.08, GAME_WIDTH - 20, GAME_HEIGHT * 0.48);
    ctx.strokeStyle = COLORS.teal;
    ctx.lineWidth = 2;
    ctx.strokeRect(10, GAME_HEIGHT * 0.08, GAME_WIDTH - 20, GAME_HEIGHT * 0.48);

    ctx.save();
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.fillText('VIRTUAL WORKBENCH', GAME_WIDTH / 2, GAME_HEIGHT * 0.08 + 18);
    ctx.font = '11px system-ui, sans-serif';
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
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.fillText(`${placed} / ${this._parts.length} parts placed`, GAME_WIDTH / 2, GAME_HEIGHT - 30);
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
    this._playerW = 55;
    this._playerH = 72;

    this._platforms = [];
    this._scrollY = 0;
    this._maxReached = 0;
    this._finishWorldY = 0;
    this._targetHeight = 0;
    this._gravity = 600;
    this._bounceVel = -390;
    this._moveSpeed = 160;
    this._dead = false;
  }

  init(_progress) {
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._dead = false;
    this._scrollY = 0;
    this._maxReached = 0;

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
  }

  update(dt, input) {
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

    if (input.keys.left || (input.pointerDown && input.pointerX < GAME_WIDTH / 2)) {
      this._playerVX = -this._moveSpeed;
    } else if (input.keys.right || (input.pointerDown && input.pointerX >= GAME_WIDTH / 2)) {
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

    for (const plat of this._platforms) {
      if (plat.broken) continue;
      const py = plat.y + this._scrollY;
      if (py < -20 || py > GAME_HEIGHT + 20) continue;

      if (plat.breakable) {
        ctx.fillStyle = COLORS.red;
        ctx.fillRect(plat.x, py, plat.w, 8);
        ctx.fillStyle = '#FF6666';
        ctx.fillRect(plat.x, py, plat.w, 3);
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = COLORS.red;
        ctx.lineWidth = 1;
        ctx.strokeRect(plat.x, py, plat.w, 8);
        ctx.setLineDash([]);
      } else {
        ctx.fillStyle = COLORS.petrol;
        ctx.fillRect(plat.x, py, plat.w, 8);
        ctx.fillStyle = COLORS.lightPetrol;
        ctx.fillRect(plat.x, py, plat.w, 3);

        if (plat.spring) {
          const sx = plat.x + plat.w / 2;
          const coilW = 6;
          const coilH = 14;
          ctx.strokeStyle = COLORS.yellow;
          ctx.lineWidth = 2;
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
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(0, finishScreenY, GAME_WIDTH, 4);
      ctx.save();
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillStyle = COLORS.yellow;
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', GAME_WIDTH / 2, finishScreenY - 8);
      ctx.restore();
    }

    const px = Math.round(this._playerX);
    const py = Math.round(this._playerY);
    if (!sprites.drawImage(ctx, 'robotFullFront', px, py, this._playerW, this._playerH)) {
      ctx.fillStyle = COLORS.petrol;
      ctx.fillRect(px, py, this._playerW, this._playerH);
    }

    const progressPct = Math.min(this._maxReached / this._targetHeight, 1);
    ctx.fillStyle = COLORS.darkPanel;
    ctx.fillRect(4, 56, 8, GAME_HEIGHT - 96);
    ctx.fillStyle = COLORS.yellow;
    const barH = (GAME_HEIGHT - 96) * progressPct;
    ctx.fillRect(4, 56 + (GAME_HEIGHT - 96) - barH, 8, barH);

    ctx.save();
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.fillText('SINUMERIK / Opcenter', GAME_WIDTH / 2, GAME_HEIGHT - 10);
    ctx.restore();

    if (this._dead) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,40,0.7)';
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillStyle = COLORS.red;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('FELL DOWN!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
      ctx.font = '16px system-ui, sans-serif';
      ctx.fillStyle = COLORS.coral;
      ctx.fillText('Tap to retry', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20);
      ctx.restore();
    }
  }

  isComplete() { return this.completed; }
}

/* ================================================================
   Level 3 -- Code Puzzle  (Software & Deployment)
   Drag logic blocks into the correct sequence.
   ================================================================ */

const CODE_BLOCKS = ['INIT', 'SCAN', 'DETECT', 'GRAB', 'MOVE', 'DEPLOY'];

const BLOCK_W = 110;
const BLOCK_H = 46;
const SLOT_GAP = 8;

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
  }

  init(_progress) {
    this.completed = false;
    this.timerMs = 0;
    this._started = false;
    this._draggingIdx = -1;

    const slotX = (GAME_WIDTH - BLOCK_W) / 2;
    const slotStartY = 120;

    this._slots = CODE_BLOCKS.map((label, i) => ({
      label,
      x: slotX,
      y: slotStartY + i * (BLOCK_H + SLOT_GAP),
      filled: false,
      filledLabel: null,
    }));

    const shuffled = [...CODE_BLOCKS];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const trayStartY = GAME_HEIGHT * 0.55;
    const cols = 2;
    const padX = (GAME_WIDTH - cols * BLOCK_W - (cols - 1) * SLOT_GAP) / 2;

    this._blocks = shuffled.map((label, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        label,
        x: padX + col * (BLOCK_W + SLOT_GAP),
        y: trayStartY + row * (BLOCK_H + SLOT_GAP),
        homeX: padX + col * (BLOCK_W + SLOT_GAP),
        homeY: trayStartY + row * (BLOCK_H + SLOT_GAP),
        placed: false,
        slotIdx: -1,
      };
    });
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
      for (let i = this._blocks.length - 1; i >= 0; i--) {
        const b = this._blocks[i];
        if (b.placed) continue;
        if (px >= b.x && px <= b.x + BLOCK_W && py >= b.y && py <= b.y + BLOCK_H) {
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

      for (let si = 0; si < this._slots.length; si++) {
        const s = this._slots[si];
        if (s.filled) continue;
        const dist = Math.hypot(b.x - s.x, b.y - s.y);
        if (dist < 50) {
          if (s.label === b.label) {
            b.x = s.x;
            b.y = s.y;
            b.placed = true;
            b.slotIdx = si;
            s.filled = true;
            s.filledLabel = b.label;
            snapped = true;
          } else {
            b.x = b.homeX;
            b.y = b.homeY;
            snapped = true;
          }
          break;
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

    ctx.save();
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.fillText('PROGRAM ROBOSTAR AI', GAME_WIDTH / 2, 70);
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = COLORS.midPanel;
    ctx.fillText('Industrial Edge / Xcelerator', GAME_WIDTH / 2, 88);
    ctx.restore();

    ctx.save();
    ctx.font = 'bold 12px monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    for (let i = 0; i < this._slots.length; i++) {
      const s = this._slots[i];

      ctx.save();
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = COLORS.midPanel;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${i + 1}.`, s.x - 8, s.y + BLOCK_H / 2);
      ctx.restore();

      if (s.filled) continue;
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = COLORS.teal;
      ctx.lineWidth = 2;
      ctx.strokeRect(s.x, s.y, BLOCK_W, BLOCK_H);
      ctx.setLineDash([]);
    }

    for (const b of this._blocks) {
      if (b.placed) {
        this._drawBlock(ctx, b, COLORS.petrol, COLORS.white);
      }
    }

    for (let i = 0; i < this._blocks.length; i++) {
      const b = this._blocks[i];
      if (b.placed) continue;
      const isDragged = i === this._draggingIdx;
      const bg = isDragged ? COLORS.focusBlue : COLORS.darkPanel;
      const fg = isDragged ? COLORS.white : COLORS.coral;
      this._drawBlock(ctx, b, bg, fg);
    }

    ctx.restore();

    const placed = this._blocks.filter(b => b.placed).length;
    ctx.save();
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.fillText(`${placed} / ${this._blocks.length} blocks connected`, GAME_WIDTH / 2, GAME_HEIGHT - 30);
    ctx.restore();
  }

  _drawBlock(ctx, b, bgColor, fgColor) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(b.x, b.y, BLOCK_W, BLOCK_H);
    ctx.strokeStyle = COLORS.teal;
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(b.x, b.y, BLOCK_W, BLOCK_H);

    ctx.save();
    ctx.font = 'bold 15px monospace';
    ctx.fillStyle = fgColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x + BLOCK_W / 2, b.y + BLOCK_H / 2);
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
