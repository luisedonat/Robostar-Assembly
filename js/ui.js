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
    this._animTime = 0; // animation timer for end screen robot
    this._linkBtnRect = null; // hit area for mobile feedback link
    this._qrImg = new Image();
    this._qrImg.src = 'assets/qr-code.png';
    this._qrMobileImg = new Image();
    this._qrMobileImg.src = 'assets/qr-codeMobile.png';

    // Name input
    this._nameInput = document.getElementById('name-input');
    this._playerName = '';
    this._nameFieldRect = null; // hit area for name field
    this._nameFieldFocused = false;
    this._leaderboard = null; // set from outside
    this._lastRank = -1;      // set after game complete

    if (this._nameInput) {
      this._nameInput.addEventListener('input', () => {
        this._playerName = this._nameInput.value.slice(0, 12);
      });
      this._nameInput.addEventListener('blur', () => {
        this._nameFieldFocused = false;
      });
    }
  }

  update(dt) {
    this._blink += dt;
    this._animTime += dt;
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
      ctx.fillStyle = active ? '#00E6DC' : '#9999A9';
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
    ctx.fillStyle = '#00E6DC';
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

  /** Check if a tap hit the mobile feedback link button. Returns true if consumed. */
  handleLinkTap(x, y) {
    const r = this._linkBtnRect;
    if (!r) return false;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      window.open('https://robostar-ideas.dev.inspire.siemens.com/', '_blank');
      return true;
    }
    return false;
  }

  /** Check if a tap hit the name input field on the menu screen. */
  handleNameFieldTap(x, y) {
    const r = this._nameFieldRect;
    if (!r) return false;
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      this._nameFieldFocused = true;
      if (this._nameInput) {
        this._nameInput.value = this._playerName;
        this._nameInput.style.pointerEvents = 'auto';
        this._nameInput.focus();
      }
      return true;
    }
    return false;
  }

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
  const titleGrad = ctx.createLinearGradient(GAME_WIDTH / 2 - 140, GAME_HEIGHT * 0.10, GAME_WIDTH / 2 + 140, GAME_HEIGHT * 0.10);
  titleGrad.addColorStop(0, '#00E6DC');
  titleGrad.addColorStop(1, '#00FFB9');
  ctx.fillStyle = titleGrad;
  ctx.fillText('Robostar', GAME_WIDTH / 2, GAME_HEIGHT * 0.10);
  ctx.fillText('Assembly', GAME_WIDTH / 2, GAME_HEIGHT * 0.10 + 44);
  ctx.restore();

    // Subtitle
    ctx.save();
  // First subtitle (normal)
  ctx.font = `500 13px ${FONT}`;
  ctx.fillStyle = '#E5E5E9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('How fast can you assemble a Robot?', GAME_WIDTH / 2, GAME_HEIGHT * 0.10 + 98);
  // Second subtitle (big, teal)
  ctx.font = `700 20px ${FONT}`;
  ctx.fillStyle = '#00E6DC';
  ctx.fillText('Play the Game and Beat the Highscore!', GAME_WIDTH / 2, GAME_HEIGHT * 0.10 + 122);
  ctx.restore();

    // Name input field
    const fieldW = 200;
    const fieldH = 36;
    const fieldX = (GAME_WIDTH - fieldW) / 2;
    const fieldY = GAME_HEIGHT * 0.10 + 160;
    this._nameFieldRect = { x: fieldX, y: fieldY, w: fieldW, h: fieldH };

    ctx.save();
    this.drawRoundedRect(ctx, fieldX, fieldY, fieldW, fieldH, 8);
    ctx.fillStyle = this._nameFieldFocused ? '#1B1B3A' : '#0A0A2E';
    ctx.fill();
    ctx.strokeStyle = this._nameFieldFocused ? '#00E6DC' : '#333353';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = `500 14px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (this._playerName) {
      ctx.fillStyle = '#E5E5E9';
      ctx.fillText(this._playerName, GAME_WIDTH / 2, fieldY + fieldH / 2);
    } else {
      ctx.fillStyle = '#666680';
      ctx.fillText('Enter your name', GAME_WIDTH / 2, fieldY + fieldH / 2);
    }
    // Blinking cursor when focused
    if (this._nameFieldFocused) {
      const textW = ctx.measureText(this._playerName || '').width;
      const cursorAlpha = 0.5 + 0.5 * Math.sin(this._blink * 4);
      ctx.globalAlpha = cursorAlpha;
      ctx.fillStyle = '#00E6DC';
      const cursorX = GAME_WIDTH / 2 + (this._playerName ? textW / 2 + 2 : 0);
      ctx.fillRect(cursorX, fieldY + 8, 1.5, fieldH - 16);
    }
    ctx.restore();

    // "Scan QR" prompt
    const qrTextY = fieldY + fieldH + 16;
    ctx.save();
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = '#E5E5E9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Scan the QR code to play on your phone!', GAME_WIDTH / 2, qrTextY);
    ctx.restore();

    // Robot and QR side by side
    const pairY = qrTextY + 24;
    const pairSize = 120;
    const gap = 16;
    const pairTotalW = pairSize * 2 + gap;
    const pairStartX = (GAME_WIDTH - pairTotalW) / 2;

    // Robot on the left
    this._drawRobostarImage(ctx, pairStartX + pairSize / 2, pairY, pairSize);

    // QR on the right
    const qrX = pairStartX + pairSize + gap;
    if (this._qrMobileImg && this._qrMobileImg.complete && this._qrMobileImg.naturalWidth > 0) {
      ctx.drawImage(this._qrMobileImg, qrX, pairY, pairSize, pairSize);
    }

    // Leaderboard
    const lbTop = this._leaderboard ? this._leaderboard.getTop(5) : [];
    if (lbTop.length > 0) {
      const lbY = GAME_HEIGHT * 0.58;

      ctx.save();
      ctx.font = `600 13px ${FONT}`;
      ctx.fillStyle = '#00E6DC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('🏆  Highscores', GAME_WIDTH / 2, lbY);
      ctx.restore();

      // Divider
      ctx.save();
      ctx.strokeStyle = '#00E6DC30';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, lbY + 22);
      ctx.lineTo(GAME_WIDTH - 60, lbY + 22);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < lbTop.length; i++) {
        const entry = lbTop[i];
        const rowY = lbY + 32 + i * 28;
        const isFirst = i === 0;

        // Rank number
        ctx.save();
        ctx.font = `700 12px ${FONT}`;
        ctx.fillStyle = isFirst ? '#FFE784' : '#9999A9';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(`${i + 1}.`, 72, rowY);
        ctx.restore();

        // Name
        ctx.save();
        ctx.font = `500 12px ${FONT}`;
        ctx.fillStyle = isFirst ? '#FFE784' : '#E5E5E9';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(entry.name, 82, rowY);
        ctx.restore();

        // Time
        ctx.save();
        ctx.font = `500 12px ${MONO}`;
        ctx.fillStyle = isFirst ? '#FFE784' : COLORS.yellow;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(this.formatTime(entry.time), GAME_WIDTH - 60, rowY);
        ctx.restore();
      }
    }

    // Pulsing call-to-action
    const alpha = 0.5 + 0.5 * Math.sin(this._blink * 2.5);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `600 16px ${FONT}`;
    ctx.fillStyle = COLORS.coral;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  ctx.fillText('Tap to start', GAME_WIDTH / 2, GAME_HEIGHT * 0.82);
    ctx.restore();

    // Footer
    ctx.save();
    ctx.font = `500 11px ${FONT}`;
    ctx.fillStyle = COLORS.midPanel;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  ctx.restore();
  }

  /* ---- Level Transition ---- */

  drawLevelTransition(ctx, levelIndex, levelName, progress) {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Fade in effect
    const fadeIn = Math.min(progress * 3, 1); // fade in over first third

    ctx.save();
    ctx.globalAlpha = fadeIn;

    // Step indicator (e.g. "Level 2 of 3")
    ctx.font = `500 14px ${FONT}`;
    ctx.fillStyle = '#9999A9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(`Level ${levelIndex + 1} of 3`, GAME_WIDTH / 2, GAME_HEIGHT * 0.32);

    // Level name
    ctx.font = `800 30px ${FONT}`;
    const grad = ctx.createLinearGradient(GAME_WIDTH / 2 - 120, GAME_HEIGHT * 0.38, GAME_WIDTH / 2 + 120, GAME_HEIGHT * 0.38);
    grad.addColorStop(0, '#00E6DC');
    grad.addColorStop(1, '#00FFB9');
    ctx.fillStyle = grad;
    ctx.fillText(levelName, GAME_WIDTH / 2, GAME_HEIGHT * 0.38);

    // Loading bar
    const barW = 200;
    const barH = 4;
    const barX = (GAME_WIDTH - barW) / 2;
    const barY = GAME_HEIGHT * 0.48;

    // Track
    this.drawRoundedRect(ctx, barX, barY, barW, barH, 2);
    ctx.fillStyle = '#333353';
    ctx.fill();

    // Fill
    const fillW = barW * progress;
    if (fillW > 0) {
      this.drawRoundedRect(ctx, barX, barY, fillW, barH, 2);
      const barGrad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      barGrad.addColorStop(0, '#00E6DC');
      barGrad.addColorStop(1, '#00FFB9');
      ctx.fillStyle = barGrad;
      ctx.fill();
    }

    // "Get ready" text
    ctx.font = `500 13px ${FONT}`;
    ctx.fillStyle = '#E5E5E9';
    ctx.fillText('Get ready…', GAME_WIDTH / 2, GAME_HEIGHT * 0.52);

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

    this._drawAnimatedRobot(ctx, GAME_WIDTH / 2, 72, 120);

  ctx.save();
  ctx.font = `800 28px ${FONT}`;
  // Bold Dynamic Petrol gradient on game-complete title
  const gcGrad = ctx.createLinearGradient(GAME_WIDTH / 2 - 140, 280, GAME_WIDTH / 2 + 140, 280);
  gcGrad.addColorStop(0, '#00E6DC');
  gcGrad.addColorStop(1, '#00FFB9');
  ctx.fillStyle = gcGrad;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Your ideas. Our next level.', GAME_WIDTH / 2, 280);
  ctx.restore();

  ctx.save();
  ctx.font = `600 14px ${FONT}`;
  ctx.fillStyle = '#E5E5E9';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Think this game can do more?', GAME_WIDTH / 2, 320);
  ctx.fillText('Scan the QR code and help us evolve it.', GAME_WIDTH / 2, 340);
  ctx.restore();

    // QR code (desktop) or tappable link (mobile)
    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const qrY = 365;

    if (isMobile) {
      // Tappable link button
      const btnW = 260;
      const btnH = 44;
      const btnX = (GAME_WIDTH - btnW) / 2;
      const btnY = qrY + 10;

      // Store hit area for tap detection
      this._linkBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

      // Button background
      ctx.save();
      this.drawRoundedRect(ctx, btnX, btnY, btnW, btnH, 10);
      ctx.fillStyle = '#00E6DC';
      ctx.fill();
      ctx.restore();

      // Button text
      ctx.save();
      ctx.font = `600 14px ${FONT}`;
      ctx.fillStyle = '#000028';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Open feedback link →', GAME_WIDTH / 2, btnY + btnH / 2);
      ctx.restore();

      // Subtitle
      ctx.save();
      ctx.font = `400 10px ${FONT}`;
      ctx.fillStyle = '#9999A9';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('robostar-ideas.dev.inspire.siemens.com', GAME_WIDTH / 2, btnY + btnH + 8);
      ctx.restore();
    } else {
      // QR code for desktop
      const qrSize = 100;
      const qrX = (GAME_WIDTH - qrSize) / 2;
      if (this._qrImg && this._qrImg.complete && this._qrImg.naturalWidth > 0) {
        ctx.drawImage(this._qrImg, qrX, qrY, qrSize, qrSize);
      } else {
        this._drawPlaceholderQR(ctx, qrX, qrY, qrSize);
      }
      this._linkBtnRect = null;
    }

    // Total time card
    this.drawBox(ctx, 40, 500, GAME_WIDTH - 80, 90, COLORS.darkPanel + 'CC', COLORS.teal + '60', 10);

    ctx.save();
    ctx.font = `500 12px ${FONT}`;
    ctx.fillStyle = '#E5E5E9';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Total time', GAME_WIDTH / 2, 506);
    ctx.restore();

    ctx.save();
    ctx.font = `700 24px ${MONO}`;
    ctx.fillStyle = COLORS.yellow;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(this.formatTime(progress.totalTime), GAME_WIDTH / 2, 524);
    ctx.restore();

    // Rank display
    if (this._lastRank > 0) {
      ctx.save();
      ctx.font = `600 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      if (this._lastRank <= 3) {
        const medals = ['🥇', '🥈', '🥉'];
        ctx.fillStyle = '#FFE784';
        ctx.fillText(`${medals[this._lastRank - 1]}  Rank #${this._lastRank} on the leaderboard!`, GAME_WIDTH / 2, 558);
      } else {
        ctx.fillStyle = '#E5E5E9';
        ctx.fillText(`Rank #${this._lastRank} on the leaderboard`, GAME_WIDTH / 2, 558);
      }
      ctx.restore();
    }

    // Best times section
    ctx.save();
    ctx.font = `600 13px ${FONT}`;
    ctx.fillStyle = '#00D7A0';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Best times', GAME_WIDTH / 2, 600);
    ctx.restore();

    // Divider
    ctx.save();
    ctx.strokeStyle = COLORS.teal + '30';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, 622);
    ctx.lineTo(GAME_WIDTH - 60, 622);
    ctx.stroke();
    ctx.restore();

    const labels = ['Design', 'Manufacturing', 'Software'];
    for (let i = 0; i < 3; i++) {
      const t = progress.data.bestTimes[i];
      const rowY = 636 + i * 36;

      ctx.save();
      ctx.font = `500 13px ${FONT}`;
      ctx.fillStyle = '#00E6DC';
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

  /**
   * Animated robot on the end screen — uses separated parts to replay
   * the assembly sequence from the code puzzle:
   * Phase 0: robot.init()     — parts slide in from off-screen and assemble
   * Phase 1: sensor.scan()    — head tilts left/right scanning
   * Phase 2: arm.grab(target) — right arm reaches out
   * Phase 3: arm.place(target)— right arm returns, left arm waves
   * Phase 4: robot.complete() — celebratory bounce + glow
   * Then loops.
   */
  _drawAnimatedRobot(ctx, centerX, topY, scale) {
    if (!this._sprites) return;

    const t = this._animTime;
    const cycleDuration = 6; // seconds per full cycle
    const phase = (t % cycleDuration) / cycleDuration; // 0..1

    // Use the same scale as level 1 assembly (PART_SCALE=0.42), halved
    const PS = 0.42 * 0.5;

    // Part definitions — exact same as PART_DEFS in level.js
    const parts = [
      { key: 'robobody',      nw: 207, nh: 261, ox:  0,   oy:  0   },
      { key: 'robohead',      nw: 210, nh: 245, ox:  0,   oy: -250 },
      { key: 'roboarm_left',  nw: 150, nh: 300, ox: -170,  oy:  30   },
      { key: 'roboarm_right', nw: 125, nh: 300, ox:  160,  oy:  30  },
      { key: 'roboleg',       nw: 150, nh: 270, ox: -50,  oy:  270 },
      { key: 'roboleg_r',     nw: 150, nh: 270, ox:  50,  oy:  270 },
    ];

    // Compute centre of robot assembly (same as level 1: cx, cy)
    const cx = centerX;
    const cy = topY + 80; // vertical centre of the robot

    // Animation offsets
    let headRot = 0;
    let armLRot = 0, armRRot = 0;
    let armROx = 0, armROy = 0;
    let bodyBounce = 0;
    let glowAlpha = 0;
    let assembleProgress = 1;

    if (phase < 0.18) {
      // robot.init() — parts slide into place
      const p = phase / 0.18;
      assembleProgress = 1 - Math.pow(1 - p, 3);
    } else if (phase < 0.36) {
      // head.scan() — head tilts left/right
      const p = (phase - 0.18) / 0.18;
      headRot = Math.sin(p * Math.PI * 3) * 0.15;
    } else if (phase < 0.54) {
      // arm.right() — right arm waves
      const p = (phase - 0.36) / 0.18;
      armRRot = Math.sin(p * Math.PI * 2) * 0.3;
    } else if (phase < 0.72) {
      // arm.left() — left arm waves
      const p = (phase - 0.54) / 0.18;
      armLRot = Math.sin(p * Math.PI * 2) * 0.3;
    } else {
      const p = (phase - 0.72) / 0.28;
      bodyBounce = -Math.abs(Math.sin(p * Math.PI * 2)) * 6;
      glowAlpha = 0.3 + 0.3 * Math.sin(p * Math.PI * 4);
    }

    // Glow
    if (glowAlpha > 0) {
      ctx.save();
      const grd = ctx.createRadialGradient(cx, cy, 10, cx, cy, 100);
      grd.addColorStop(0, `rgba(0, 230, 220, ${glowAlpha})`);
      grd.addColorStop(1, 'rgba(0, 230, 220, 0)');
      ctx.fillStyle = grd;
      ctx.fillRect(cx - 100, cy - 100, 200, 200);
      ctx.restore();
    }

    const slideOff = 1 - assembleProgress;

    // Slide-in directions per part
    const slideVecs = [
      [0, -120],   // body from top
      [0, -150],   // head from above
      [-100, 0],   // left arm from left
      [100, 0],    // right arm from right
      [-60, 120],  // left leg from bottom-left
      [60, 120],   // right leg from bottom-right
    ];

    const drawPart = (idx, extraRot, extraOx, extraOy) => {
      const def = parts[idx];
      const img = this._sprites.getImage(def.key === 'roboleg_r' ? 'roboleg' : def.key);
      if (!img) return;

      const pw = def.nw * PS;
      const ph = def.nh * PS;
      // Target position — same formula as level 1
      const tx = cx + def.ox * PS - pw / 2;
      const ty = cy + def.oy * PS - ph / 2;

      const sv = slideVecs[idx];
      const sx = tx + sv[0] * slideOff + extraOx;
      const sy = ty + sv[1] * slideOff + extraOy + bodyBounce;

      const pivX = sx + pw / 2;
      const pivY = sy + ph * 0.2;

      ctx.save();
      if (def.key === 'roboleg_r') {
        // Flip horizontally for right leg
        ctx.translate(pivX, pivY);
        ctx.scale(-1, 1);
        ctx.rotate(extraRot);
        ctx.translate(-pivX, -pivY);
      } else {
        ctx.translate(pivX, pivY);
        ctx.rotate(extraRot);
        ctx.translate(-pivX, -pivY);
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      this._sprites.drawImage(ctx, def.key === 'roboleg_r' ? 'roboleg' : def.key, sx, sy, pw, ph);
      ctx.restore();
    };

    // Draw back-to-front: legs, arms, body, head
    drawPart(4, 0, 0, 0);                          // left leg
    drawPart(5, 0, 0, 0);                          // right leg
    drawPart(2, armLRot, 0, 0);                    // left arm
    drawPart(3, armRRot, armROx, armROy);           // right arm
    drawPart(0, 0, 0, 0);                          // body
    drawPart(1, headRot, 0, 0);                    // head
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

