import { COLORS } from './sprites.js';
import { GAME_WIDTH, GAME_HEIGHT } from './engine.js';

const FONT = "'Inter', 'Siemens Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace";

export class UI {
  constructor(sprites) {
    this._blink = 0;
    this._sprites = sprites || null;
  }

  update(dt) {
    this._blink += dt;
  }

  drawText(ctx, text, x, y, size = 16, color = COLORS.white, align = 'left', font = FONT) {
    ctx.save();
    ctx.font = `600 ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawTextCentered(ctx, text, y, size = 16, color = COLORS.white, font = FONT) {
    this.drawText(ctx, text, GAME_WIDTH / 2, y, size, color, 'center', font);
  }

  drawRoundedRect(ctx, x, y, w, h, r = 8) {
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

  drawBox(ctx, x, y, w, h, fill = COLORS.darkPanel, stroke = COLORS.midPanel, radius = 8) {
    ctx.save();
    this.drawRoundedRect(ctx, x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  /* ---- HUD ---- */

  drawHUD(ctx, levelName, timerMs, parts) {
    // Frosted top bar
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, 0, 56);
    grad.addColorStop(0, COLORS.navy + 'F0');
    grad.addColorStop(1, COLORS.navy + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, 56);
    ctx.restore();

    // Part indicators — rounded pills
    const partColors = [COLORS.petrol, COLORS.teal, COLORS.lightPetrol];
    const pillW = 24;
    const pillH = 24;
    const pillGap = 8;
    const totalPillW = 3 * pillW + 2 * pillGap;
    const startX = (GAME_WIDTH - totalPillW) / 2;
    for (let i = 0; i < 3; i++) {
      const px = startX + i * (pillW + pillGap);
      const active = parts[i];
      ctx.save();
      this.drawRoundedRect(ctx, px, 8, pillW, pillH, 6);
      ctx.fillStyle = active ? partColors[i] : COLORS.darkPanel;
      ctx.fill();
      if (active) {
        ctx.shadowColor = partColors[i];
        ctx.shadowBlur = 8;
      }
      ctx.restore();
      ctx.save();
      ctx.font = `700 12px ${FONT}`;
      ctx.fillStyle = active ? COLORS.white : COLORS.midPanel;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), px + pillW / 2, 8 + pillH / 2);
      ctx.restore();
    }

    // Level name
    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.petrol;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(levelName, 14, 36);
    ctx.restore();

    // Timer
    const timeStr = this.formatTime(timerMs);
    ctx.save();
    ctx.font = `500 11px ${MONO}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, GAME_WIDTH - 14, 36);
    ctx.restore();
  }

  /* ---- Menu Screen ---- */

  drawMenuScreen(ctx) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.save();
    ctx.font = `800 40px ${FONT}`;
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.letterSpacing = '0.08em';
    ctx.fillText('ROBOSTAR', GAME_WIDTH / 2, GAME_HEIGHT * 0.18);
    ctx.restore();

    ctx.save();
    ctx.font = `600 22px ${FONT}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ASSEMBLY', GAME_WIDTH / 2, GAME_HEIGHT * 0.18 + 50);
    ctx.restore();

    this._drawRobostarImage(ctx, GAME_WIDTH / 2, GAME_HEIGHT * 0.34, 160);

    // Pulsing call-to-action
    const alpha = 0.5 + 0.5 * Math.sin(this._blink * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TAP TO START', GAME_WIDTH / 2, GAME_HEIGHT * 0.68);
    ctx.restore();

    // Footer
    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('POWERED BY SIEMENS', GAME_WIDTH / 2, GAME_HEIGHT - 44);
    ctx.restore();
  }

  /* ---- Level Complete ---- */

  drawLevelComplete(ctx, levelIndex, timeMs, partName) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.font = `800 30px ${FONT}`;
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('LEVEL COMPLETE!', GAME_WIDTH / 2, 100);
    ctx.restore();

    ctx.save();
    ctx.font = `500 16px ${MONO}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`TIME: ${this.formatTime(timeMs)}`, GAME_WIDTH / 2, 155);
    ctx.restore();

    // Divider line
    ctx.save();
    ctx.strokeStyle = COLORS.teal + '40';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(GAME_WIDTH * 0.2, 195);
    ctx.lineTo(GAME_WIDTH * 0.8, 195);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('NEW PART ASSEMBLED:', GAME_WIDTH / 2, 220);
    ctx.restore();

    ctx.save();
    ctx.font = `700 26px ${FONT}`;
    ctx.fillStyle = COLORS.lightPetrol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(partName.toUpperCase(), GAME_WIDTH / 2, 250);
    ctx.restore();

    this._drawRobostarImage(ctx, GAME_WIDTH / 2, 310, 120);

    const alpha = 0.5 + 0.5 * Math.sin(this._blink * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TAP TO CONTINUE', GAME_WIDTH / 2, GAME_HEIGHT - 80);
    ctx.restore();
  }

  /* ---- Game Complete ---- */

  drawGameComplete(ctx, progress) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    ctx.save();
    ctx.font = `800 34px ${FONT}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ROBOSTAR', GAME_WIDTH / 2, 60);
    ctx.fillText('COMPLETE!', GAME_WIDTH / 2, 100);
    ctx.restore();

    this._drawRobostarImage(ctx, GAME_WIDTH / 2, 160, 140);

    ctx.save();
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = COLORS.petrol;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ALL PARTS ASSEMBLED', GAME_WIDTH / 2, 340);
    ctx.restore();

    // Total time card
    this.drawBox(ctx, 40, 375, GAME_WIDTH - 80, 70, COLORS.darkPanel + 'CC', COLORS.teal + '60', 10);

    ctx.save();
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TOTAL TIME', GAME_WIDTH / 2, 388);
    ctx.restore();

    ctx.save();
    ctx.font = `700 24px ${MONO}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.formatTime(progress.totalTime), GAME_WIDTH / 2, 412);
    ctx.restore();

    // Best times section
    ctx.save();
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = COLORS.teal;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('BEST TIMES', GAME_WIDTH / 2, 468);
    ctx.restore();

    // Divider
    ctx.save();
    ctx.strokeStyle = COLORS.teal + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 490);
    ctx.lineTo(GAME_WIDTH - 60, 490);
    ctx.stroke();
    ctx.restore();

    const labels = ['DESIGN', 'MANUFACTURING', 'SOFTWARE'];
    for (let i = 0; i < 3; i++) {
      const t = progress.data.bestTimes[i];
      const rowY = 504 + i * 36;

      ctx.save();
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = COLORS.lightPetrol;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.fillText(labels[i], 60, rowY);
      ctx.restore();

      ctx.save();
      ctx.font = `500 13px ${MONO}`;
      ctx.fillStyle = COLORS.yellow;
      ctx.textBaseline = 'top';
      ctx.textAlign = 'right';
      ctx.fillText(this.formatTime(t), GAME_WIDTH - 60, rowY);
      ctx.restore();
    }

    const alpha = 0.5 + 0.5 * Math.sin(this._blink * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('TAP TO REPLAY', GAME_WIDTH / 2, GAME_HEIGHT - 120);
    ctx.restore();

    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('POWERED BY SIEMENS TECHNOLOGY', GAME_WIDTH / 2, GAME_HEIGHT - 34);
    ctx.restore();
  }

  /* ---- Helpers ---- */

  formatTime(ms) {
    if (ms === null || ms === undefined) return '--:--.--';
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    const cent = Math.floor((totalSec * 100) % 100);
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cent).padStart(2, '0')}`;
  }

  _drawRobostarImage(ctx, centerX, y, width) {
    if (this._sprites) {
      const img = this._sprites.getImage('robotFullFront');
      if (img) {
        const ratio = img.naturalWidth / img.naturalHeight;
        const h = width / ratio;
        const x = centerX - width / 2;
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        this._sprites.drawImage(ctx, 'robotFullFront', x, y, width, h);
        ctx.restore();
        return;
      }
    }
    const h = width * 1.1;
    ctx.save();
    this.drawRoundedRect(ctx, centerX - width / 2, y, width, h, 12);
    ctx.fillStyle = COLORS.petrol;
    ctx.fill();
    ctx.restore();
  }
}
