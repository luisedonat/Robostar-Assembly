import { COLORS } from './sprites.js';
import { GAME_WIDTH, GAME_HEIGHT } from './engine.js';

const FONT = "'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = 'monospace';

export class UI {
  constructor() {
    this._blink = 0;
  }

  update(dt) {
    this._blink += dt;
  }

  drawText(ctx, text, x, y, size = 16, color = COLORS.white, align = 'left', font = FONT) {
    ctx.save();
    ctx.font = `bold ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  drawTextCentered(ctx, text, y, size = 16, color = COLORS.white, font = FONT) {
    this.drawText(ctx, text, GAME_WIDTH / 2, y, size, color, 'center', font);
  }

  drawBox(ctx, x, y, w, h, fill = COLORS.darkPanel, stroke = COLORS.midPanel) {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  /* ---- HUD ---- */

  drawHUD(ctx, levelName, timerMs, parts) {
    this.drawBox(ctx, 0, 0, GAME_WIDTH, 50, COLORS.navy + 'DD', COLORS.teal);

    const partIcons = ['1', '2', '3'];
    const partColors = [COLORS.petrol, COLORS.teal, COLORS.lightPetrol];
    for (let i = 0; i < 3; i++) {
      const px = GAME_WIDTH / 2 - 36 + i * 26;
      const active = parts[i];
      ctx.fillStyle = active ? partColors[i] : COLORS.midPanel;
      ctx.fillRect(px, 5, 20, 20);
      this.drawText(ctx, partIcons[i], px + 5, 6, 14, active ? COLORS.white : COLORS.darkPanel);
    }

    this.drawText(ctx, levelName, 10, 30, 12, COLORS.petrol);

    const timeStr = this.formatTime(timerMs);
    this.drawText(ctx, timeStr, GAME_WIDTH - 10, 30, 12, COLORS.yellow, 'right', MONO);
  }

  /* ---- Menu Screen ---- */

  drawMenuScreen(ctx) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this._drawFactoryBg(ctx);

    this.drawTextCentered(ctx, 'ROBOSTAR', GAME_HEIGHT * 0.22, 42, COLORS.petrol);
    this.drawTextCentered(ctx, 'ASSEMBLY', GAME_HEIGHT * 0.22 + 48, 24, COLORS.yellow);

    this._drawMiniRobostar(ctx, GAME_WIDTH / 2 - 36, GAME_HEIGHT * 0.40, true);

    const show = Math.sin(this._blink * 3) > 0;
    if (show) {
      this.drawTextCentered(ctx, 'TAP TO START', GAME_HEIGHT * 0.65, 18, COLORS.coral);
    }

    this.drawTextCentered(ctx, 'POWERED BY SIEMENS', GAME_HEIGHT - 40, 12, COLORS.midPanel);
  }

  /* ---- Level Complete ---- */

  drawLevelComplete(ctx, levelIndex, timeMs, partName) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this.drawTextCentered(ctx, 'LEVEL COMPLETE!', 100, 32, COLORS.petrol);

    this.drawTextCentered(ctx, `TIME: ${this.formatTime(timeMs)}`, 160, 18, COLORS.yellow, MONO);

    this.drawTextCentered(ctx, 'NEW PART ASSEMBLED:', 230, 15, COLORS.midPanel);
    this.drawTextCentered(ctx, partName.toUpperCase(), 260, 28, COLORS.lightPetrol);

    this._drawMiniRobostar(ctx, GAME_WIDTH / 2 - 36, 320, false, levelIndex);

    const show = Math.sin(this._blink * 3) > 0;
    if (show) {
      this.drawTextCentered(ctx, 'TAP TO CONTINUE', GAME_HEIGHT - 80, 18, COLORS.coral);
    }
  }

  /* ---- Game Complete ---- */

  drawGameComplete(ctx, progress) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    this._drawFactoryBg(ctx);

    this.drawTextCentered(ctx, 'ROBOSTAR', 60, 36, COLORS.yellow);
    this.drawTextCentered(ctx, 'COMPLETE!', 100, 36, COLORS.yellow);

    this._drawMiniRobostar(ctx, GAME_WIDTH / 2 - 36, 160, true);

    this.drawTextCentered(ctx, 'ALL PARTS ASSEMBLED', 280, 18, COLORS.petrol);

    this.drawTextCentered(ctx, 'TOTAL TIME', 330, 15, COLORS.midPanel);
    this.drawTextCentered(ctx, this.formatTime(progress.totalTime), 355, 26, COLORS.yellow, MONO);

    this.drawTextCentered(ctx, '--- BEST TIMES ---', 420, 14, COLORS.teal);
    const labels = ['DESIGN', 'MANUFACTURING', 'SOFTWARE'];
    for (let i = 0; i < 3; i++) {
      const t = progress.data.bestTimes[i];
      this.drawText(ctx, labels[i], 60, 450 + i * 30, 14, COLORS.lightPetrol);
      this.drawText(ctx, this.formatTime(t), GAME_WIDTH - 60, 450 + i * 30, 14, COLORS.yellow, 'right', MONO);
    }

    const show = Math.sin(this._blink * 3) > 0;
    if (show) {
      this.drawTextCentered(ctx, 'TAP TO REPLAY', GAME_HEIGHT - 120, 18, COLORS.coral);
    }

    this.drawTextCentered(ctx, 'POWERED BY SIEMENS TECHNOLOGY', GAME_HEIGHT - 30, 12, COLORS.midPanel);
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

  _drawFactoryBg(ctx) {
    ctx.fillStyle = COLORS.darkPanel;
    for (let x = 0; x < GAME_WIDTH; x += 48) {
      ctx.fillRect(x, GAME_HEIGHT - 72, 42, 72);
    }
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(0, GAME_HEIGHT - 72, GAME_WIDTH, 3);
  }

  _drawMiniRobostar(ctx, x, y, allParts, upToLevel = 2) {
    ctx.fillStyle = (upToLevel >= 0 || allParts) ? COLORS.petrol : COLORS.midPanel;
    ctx.fillRect(x + 8, y + 54, 18, 20);
    ctx.fillRect(x + 46, y + 54, 18, 20);

    ctx.fillStyle = (upToLevel >= 1 || allParts) ? COLORS.teal : COLORS.midPanel;
    ctx.fillRect(x + 6, y + 20, 60, 34);
    if (upToLevel >= 1 || allParts) {
      ctx.fillStyle = COLORS.yellow;
      ctx.fillRect(x + 20, y + 32, 8, 8);
      ctx.fillRect(x + 42, y + 32, 8, 8);
    }

    ctx.fillStyle = (upToLevel >= 2 || allParts) ? COLORS.lightPetrol : COLORS.midPanel;
    ctx.fillRect(x + 12, y, 48, 22);
    if (upToLevel >= 2 || allParts) {
      ctx.fillStyle = COLORS.coral;
      ctx.fillRect(x + 42, y + 6, 8, 8);
      ctx.fillStyle = COLORS.yellowBright;
      ctx.fillRect(x + 32, y + 3, 8, 6);
    }
  }
}
