import { COLORS } from './sprites.js';
import { GAME_WIDTH, GAME_HEIGHT } from './engine.js';

const FONT = "'Siemens Sans Pro Roman', 'Siemens Sans', 'Segoe UI', system-ui, -apple-system, sans-serif";
const MONO = "'SF Mono', 'Fira Code', 'JetBrains Mono', 'Cascadia Code', monospace";

// UI layout constants
const BTN_SIZE = 22; // kept for spacing if needed in future

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
    const grad = ctx.createLinearGradient(0, 0, 0, 96);
    grad.addColorStop(0, COLORS.navy + 'F0');
    grad.addColorStop(1, COLORS.navy + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, 96);
    ctx.restore();

    // ── Modern step indicator ──
    const stepY = 32;
    const stepRadius = 14;
    const stepGap = 80;           // centre-to-centre distance
    const totalW = 2 * stepGap;   // 3 dots, 2 gaps
    const startX = (GAME_WIDTH - totalW) / 2;

    const labelList = ['Design', 'Manufacturing', 'Software'];

    for (let i = 0; i < 3; i++) {
      const cx = startX + i * stepGap;
      const active = parts[i];

      // Connector line to previous dot
      if (i > 0) {
        const prevX = startX + (i - 1) * stepGap;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(prevX + stepRadius + 2, stepY);
        ctx.lineTo(cx - stepRadius - 2, stepY);
        ctx.strokeStyle = parts[i - 1] ? '#00E6DC' : '#333353';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      // Circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, stepY, stepRadius, 0, Math.PI * 2);
      if (active) {
        ctx.fillStyle = '#00E6DC';
        ctx.fill();
        ctx.shadowColor = '#00E6DC';
        ctx.shadowBlur = 10;
      } else {
        ctx.fillStyle = '#333353';
        ctx.fill();
        ctx.strokeStyle = '#66667E';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.restore();

      // Number inside circle
      ctx.save();
      ctx.font = `600 11px ${FONT}`;
      ctx.fillStyle = active ? '#000028' : '#9999A9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), cx, stepY + 1);
      ctx.restore();

      // Label underneath — lighter teal, bigger font
      ctx.save();
      ctx.font = `500 10px ${FONT}`;
      ctx.fillStyle = active ? '#00BEDC' : '#9999A9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labelList[i], cx, stepY + stepRadius + 6);
      ctx.restore();
    }

    // Thin separator line
    ctx.save();
    ctx.strokeStyle = '#333353';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, 72);
    ctx.lineTo(GAME_WIDTH - 14, 72);
    ctx.stroke();
    ctx.restore();

    // Level name — left
    ctx.save();
    ctx.font = `500 10px ${FONT}`;
    ctx.fillStyle = '#00BEDC';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(levelName, 14, 78);
    ctx.restore();

    // Timer — right
    const timeStr = this.formatTime(timerMs);
    ctx.save();
    ctx.font = `500 10px ${MONO}`;
    ctx.fillStyle = '#CCCCD4';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'right';
    ctx.fillText(timeStr, GAME_WIDTH - 14, 78);
    ctx.restore();
  }

  /** HUD tap handler — no mute buttons, so always return false (not consumed) */
  handleHUDTap(x, y) { return false; }

  _drawMuteBtn(ctx, x, y, isOn, type) {
    ctx.save();

    // Button background
    this.drawRoundedRect(ctx, x, y, BTN_SIZE, BTN_SIZE, 5);
    ctx.fillStyle = isOn ? COLORS.darkPanel + 'CC' : COLORS.darkPanel + '99';
    ctx.fill();
    ctx.strokeStyle = isOn ? COLORS.petrol + '80' : COLORS.midPanel + '50';
    ctx.lineWidth = 1;
    ctx.stroke();

    const cx = x + BTN_SIZE / 2;
    const cy = y + BTN_SIZE / 2;

    ctx.strokeStyle = isOn ? COLORS.petrol : COLORS.midPanel;
    ctx.fillStyle = isOn ? COLORS.petrol : COLORS.midPanel;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    if (type === 'music') {
      // ♪ Music note icon
      // Note head
      ctx.beginPath();
      ctx.ellipse(cx - 3, cy + 3, 3, 2.2, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // Stem
      ctx.beginPath();
      ctx.moveTo(cx, cy + 2);
      ctx.lineTo(cx, cy - 5);
      ctx.stroke();
      // Flag
      ctx.beginPath();
      ctx.moveTo(cx, cy - 5);
      ctx.quadraticCurveTo(cx + 5, cy - 3, cx + 3, cy - 1);
      ctx.stroke();
    } else {
      // Speaker icon
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 2);
      ctx.lineTo(cx - 1, cy - 2);
      ctx.lineTo(cx + 3, cy - 5);
      ctx.lineTo(cx + 3, cy + 5);
      ctx.lineTo(cx - 1, cy + 2);
      ctx.lineTo(cx - 4, cy + 2);
      ctx.closePath();
      ctx.fill();

      if (isOn) {
        // Sound waves
        ctx.beginPath();
        ctx.arc(cx + 3, cy, 4, -0.6, 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx + 3, cy, 7, -0.5, 0.5);
        ctx.stroke();
      }
    }

    // Strike-through line when muted
    if (!isOn) {
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 4, y + BTN_SIZE - 4);
      ctx.lineTo(x + BTN_SIZE - 4, y + 4);
      ctx.stroke();
    }

    ctx.restore();
  }

  /* ---- Menu Screen ---- */

  drawMenuScreen(ctx) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Title
    ctx.save();
    ctx.font = `800 38px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  // Main title gradient per brand guidance
  const titleGrad = ctx.createLinearGradient(GAME_WIDTH / 2 - 140, GAME_HEIGHT * 0.16, GAME_WIDTH / 2 + 140, GAME_HEIGHT * 0.16);
  titleGrad.addColorStop(0, '#00E6DC');
  titleGrad.addColorStop(1, '#00FFB9');
  ctx.fillStyle = titleGrad;
  ctx.fillText('Robostar', GAME_WIDTH / 2, GAME_HEIGHT * 0.16);
  ctx.fillText('Assembly', GAME_WIDTH / 2, GAME_HEIGHT * 0.16 + 44);
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
  ctx.fillText('Tap to start', GAME_WIDTH / 2, GAME_HEIGHT * 0.68);
    ctx.restore();

    // Footer
    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  ctx.restore();
  }

  /* ---- Level Complete ---- */

  drawLevelComplete(ctx, levelIndex, timeMs, partName) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.save();
  ctx.font = `800 30px ${FONT}`;
  // Bold Dynamic Petrol gradient on level-complete title
  const lcGrad = ctx.createLinearGradient(GAME_WIDTH / 2 - 120, 100, GAME_WIDTH / 2 + 120, 100);
  lcGrad.addColorStop(0, COLORS.petrol);
  lcGrad.addColorStop(0.5, COLORS.yellow);
  lcGrad.addColorStop(1, COLORS.lightPetrol);
  ctx.fillStyle = lcGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Level complete', GAME_WIDTH / 2, 100);
  ctx.restore();

  ctx.save();
  ctx.font = `500 16px ${MONO}`;
  ctx.fillStyle = COLORS.yellow;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`Time: ${this.formatTime(timeMs)}`, GAME_WIDTH / 2, 155);
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
  ctx.fillText('New part assembled:', GAME_WIDTH / 2, 220);
  ctx.restore();

  ctx.save();
  ctx.font = `700 26px ${FONT}`;
  ctx.fillStyle = COLORS.lightPetrol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const displayPart = partName.replace(/_/g, ' ');
  ctx.fillText(displayPart, GAME_WIDTH / 2, 250);
  ctx.restore();

    this._drawRobostarImage(ctx, GAME_WIDTH / 2, 310, 120);

    const alpha = 0.5 + 0.5 * Math.sin(this._blink * 2.5);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `600 16px ${FONT}`;
  ctx.fillStyle = COLORS.coral;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Tap to continue', GAME_WIDTH / 2, GAME_HEIGHT - 80);
  ctx.restore();
  }

  /* ---- Game Complete ---- */

  drawGameComplete(ctx, progress) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  ctx.save();
  ctx.font = `800 28px ${FONT}`;
  // Bold Dynamic Petrol gradient on game-complete title
  const gcGrad = ctx.createLinearGradient(GAME_WIDTH / 2 - 140, 72, GAME_WIDTH / 2 + 140, 72);
  gcGrad.addColorStop(0, '#00E6DC');
  gcGrad.addColorStop(1, '#00FFB9');
  ctx.fillStyle = gcGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Your ideas. Our next level.', GAME_WIDTH / 2, 72);
  ctx.restore();

    this._drawRobostarImage(ctx, GAME_WIDTH / 2, 160, 140);

  ctx.save();
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = COLORS.petrol;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Think this game can do more?', GAME_WIDTH / 2, 338);
  ctx.fillText('Scan the QR code and help us evolve it.', GAME_WIDTH / 2, 358);
  ctx.restore();

    // Placeholder QR code
    const qrSize = 100;
    const qrX = (GAME_WIDTH - qrSize) / 2;
    const qrY = 380;
    this._drawPlaceholderQR(ctx, qrX, qrY, qrSize);

    // Total time card
    this.drawBox(ctx, 40, 500, GAME_WIDTH - 80, 70, COLORS.darkPanel + 'CC', COLORS.teal + '60', 10);

    ctx.save();
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Total time', GAME_WIDTH / 2, 513);
    ctx.restore();

    ctx.save();
    ctx.font = `700 24px ${MONO}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.formatTime(progress.totalTime), GAME_WIDTH / 2, 537);
    ctx.restore();

    // Best times section
    ctx.save();
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = COLORS.teal;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Best times', GAME_WIDTH / 2, 590);
    ctx.restore();

    // Divider
    ctx.save();
    ctx.strokeStyle = COLORS.teal + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 612);
    ctx.lineTo(GAME_WIDTH - 60, 612);
    ctx.stroke();
    ctx.restore();

    const labels = ['Design', 'Manufacturing', 'Software'];
    for (let i = 0; i < 3; i++) {
      const t = progress.data.bestTimes[i];
      const rowY = 626 + i * 36;

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
  ctx.fillText('Tap to replay', GAME_WIDTH / 2, GAME_HEIGHT - 120);
    ctx.restore();

    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
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

  _drawPlaceholderQR(ctx, x, y, size) {
    // White background
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x, y, size, size);

    // Draw a grid pattern to look like a QR code
    const cells = 21; // standard QR grid
    const cellSize = size / cells;
    ctx.fillStyle = '#000000';

    // Finder patterns (3 corners)
    const drawFinder = (fx, fy) => {
      // Outer 7x7
      ctx.fillRect(fx, fy, cellSize * 7, cellSize * 7);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(fx + cellSize, fy + cellSize, cellSize * 5, cellSize * 5);
      ctx.fillStyle = '#000000';
      ctx.fillRect(fx + cellSize * 2, fy + cellSize * 2, cellSize * 3, cellSize * 3);
    };

    drawFinder(x, y);
    drawFinder(x + cellSize * 14, y);
    drawFinder(x, y + cellSize * 14);

    // Pseudo-random data modules
    const seed = 42;
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        // Skip finder pattern areas
        if (r < 8 && c < 8) continue;
        if (r < 8 && c > 12) continue;
        if (r > 12 && c < 8) continue;
        // Simple hash for deterministic pattern
        if (((r * 31 + c * 17 + seed) % 5) < 2) {
          ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.restore();
  }
}

