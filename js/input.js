const SWIPE_THRESHOLD = 30;
const TILT_DEADZONE = 3;    // degrees of tilt before registering movement
const TILT_MAX = 18;        // degrees at which tilt reaches full speed

// Logical game dimensions (must match engine.js)
const GAME_W = 390;
const GAME_H = 844;

export class Input {
  constructor(canvas) {
    this.canvas = canvas;

    this.keys = {
      left: false,
      right: false,
      up: false,
      down: false,
      action: false,
    };

    this._tap = false;
    this._tapX = 0;
    this._tapY = 0;
    this._swipe = null;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._touching = false;

    this._dragging = false;
    this._dragX = 0;
    this._dragY = 0;
    this._dragStartX = 0;
    this._dragStartY = 0;
    this._dragEnded = false;
    this._dragEndX = 0;
    this._dragEndY = 0;
    this._pointerDown = false;
    this._pointerX = 0;
    this._pointerY = 0;
    this._completedSwipe = null;

    // Tilt / gyroscope state
    this._tiltX = 0;             // normalised –1 … +1
    this._tiltRaw = 0;           // raw gamma degrees
    this._tiltAvailable = false; // true once we receive a deviceorientation event
    this._tiltPermission = false;// true once permission granted (iOS)

    this._lockScrolling();
    this._bindKeyboard();
    this._bindPointer();
    this._bindTilt();
  }

  /** Prevent ALL scrolling / bounce / pull-to-refresh at the document level */
  _lockScrolling() {
    const opts = { passive: false };

    // Block touchmove on the entire document (prevents pull-to-refresh, rubber-band)
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, opts);

    // Block Safari pinch-zoom gesture
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    }, opts);
    document.addEventListener('gesturechange', (e) => {
      e.preventDefault();
    }, opts);
    document.addEventListener('gestureend', (e) => {
      e.preventDefault();
    }, opts);

    // Extra: prevent wheel-zoom on desktop when Ctrl is held
    document.addEventListener('wheel', (e) => {
      if (e.ctrlKey) e.preventDefault();
    }, opts);
  }

  /**
   * Request the Fullscreen API (hides browser chrome on Android).
   * Must be called from a user-gesture handler.
   */
  requestFullscreen() {
    const el = document.documentElement;
    const rfs = el.requestFullscreen
      || el.webkitRequestFullscreen
      || el.mozRequestFullScreen
      || el.msRequestFullscreen;
    if (rfs) {
      try { rfs.call(el); } catch (_) { /* ignore */ }
    }
  }

  _bindKeyboard() {
    const keyMap = {
      ArrowLeft: 'left',
      ArrowRight: 'right',
      ArrowUp: 'up',
      ArrowDown: 'down',
      ' ': 'action',
      Enter: 'action',
    };

    window.addEventListener('keydown', (e) => {
      const k = keyMap[e.key];
      if (k) {
        e.preventDefault();
        this.keys[k] = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = keyMap[e.key];
      if (k) {
        e.preventDefault();
        this.keys[k] = false;
      }
    });
  }

  _canvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    // Map from CSS client coords directly to game-logical coords
    return {
      x: (clientX - rect.left) * (GAME_W / rect.width),
      y: (clientY - rect.top) * (GAME_H / rect.height),
    };
  }

  _bindPointer() {
    const el = this.canvas;

    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const pos = this._canvasCoords(e.clientX, e.clientY);

      this._pointerDown = true;
      this._pointerX = pos.x;
      this._pointerY = pos.y;

      this._touchStartX = pos.x;
      this._touchStartY = pos.y;
      this._touching = true;

      this._tap = true;
      this._tapX = pos.x;
      this._tapY = pos.y;

      this._dragging = true;
      this._dragStartX = pos.x;
      this._dragStartY = pos.y;
      this._dragX = pos.x;
      this._dragY = pos.y;
      this._dragEnded = false;

      const half = GAME_W / 2;
      this.keys.left = pos.x < half;
      this.keys.right = pos.x >= half;
    }, { passive: false });

    el.addEventListener('pointermove', (e) => {
      e.preventDefault();
      if (!this._pointerDown) return;
      const pos = this._canvasCoords(e.clientX, e.clientY);

      this._pointerX = pos.x;
      this._pointerY = pos.y;
      this._dragX = pos.x;
      this._dragY = pos.y;

      const dx = pos.x - this._touchStartX;
      const dy = pos.y - this._touchStartY;

      if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(dy) > SWIPE_THRESHOLD) {
        if (Math.abs(dx) > Math.abs(dy)) {
          this._swipe = dx > 0 ? 'right' : 'left';
        } else {
          this._swipe = dy > 0 ? 'down' : 'up';
        }
      }
    }, { passive: false });

    el.addEventListener('pointerup', (e) => {
      e.preventDefault();
      const pos = this._canvasCoords(e.clientX, e.clientY);

      this._pointerDown = false;
      this._touching = false;
      this.keys.left = false;
      this.keys.right = false;

      if (this._dragging) {
        this._dragging = false;
        this._dragEnded = true;
        this._dragEndX = pos.x;
        this._dragEndY = pos.y;
      }

      if (this._swipe) {
        this._completedSwipe = this._swipe;
      }
      if (this._swipe === 'up') {
        this.keys.up = true;
        requestAnimationFrame(() => { this.keys.up = false; });
      }
      if (this._swipe === 'down') {
        this.keys.down = true;
        requestAnimationFrame(() => { this.keys.down = false; });
      }
      this._swipe = null;
    }, { passive: false });

    el.addEventListener('pointercancel', (e) => {
      this._pointerDown = false;
      this._touching = false;
      this._dragging = false;
      this.keys.left = false;
      this.keys.right = false;
    });

    el.style.touchAction = 'none';
  }

  // ── Tilt / DeviceOrientation ──────────────────────────

  _bindTilt() {
    const handler = (e) => {
      if (e.gamma == null) return;
      this._tiltAvailable = true;
      this._tiltRaw = e.gamma; // –90 … +90 (left/right tilt)

      // Apply dead-zone and normalise to –1 … +1
      let g = e.gamma;
      if (Math.abs(g) < TILT_DEADZONE) {
        this._tiltX = 0;
      } else {
        const sign = g > 0 ? 1 : -1;
        const clamped = Math.min(Math.abs(g) - TILT_DEADZONE, TILT_MAX - TILT_DEADZONE);
        this._tiltX = sign * (clamped / (TILT_MAX - TILT_DEADZONE));
      }

      // Set left/right keys from tilt when no touch is active
      if (!this._pointerDown) {
        this.keys.left = this._tiltX < -0.1;
        this.keys.right = this._tiltX > 0.1;
      }
    };

    // iOS 13+ requires explicit permission request
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      // Permission must be requested from a user gesture — we do it on first tap
      this._tiltPermission = false;
    } else {
      // Android / desktop — just listen
      window.addEventListener('deviceorientation', handler);
      this._tiltPermission = true;
    }

    // Store handler so requestTiltPermission can attach it later
    this._tiltHandler = handler;
  }

  /**
   * Call from a user-gesture handler (e.g. first tap) to request
   * DeviceOrientation permission on iOS.
   */
  async requestTiltPermission() {
    if (this._tiltPermission) return true;
    try {
      if (typeof DeviceOrientationEvent !== 'undefined' &&
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          window.addEventListener('deviceorientation', this._tiltHandler);
          this._tiltPermission = true;
          return true;
        }
      }
    } catch (e) {
      console.warn('Tilt permission denied:', e);
    }
    return false;
  }

  get tap() { return this._tap; }
  get tapX() { return this._tapX; }
  get tapY() { return this._tapY; }
  get swipe() { return this._swipe; }

  get isDragging() { return this._dragging; }
  get dragX() { return this._dragX; }
  get dragY() { return this._dragY; }
  get dragStartX() { return this._dragStartX; }
  get dragStartY() { return this._dragStartY; }
  get pointerDown() { return this._pointerDown; }
  get pointerX() { return this._pointerX; }
  get pointerY() { return this._pointerY; }

  /** Normalised tilt: –1 (full left) … 0 (flat) … +1 (full right) */
  get tiltX() { return this._tiltX; }
  /** True once a deviceorientation event has been received */
  get tiltAvailable() { return this._tiltAvailable; }

  consumeTap() {
    const was = this._tap;
    this._tap = false;
    return was;
  }

  consumeSwipe() {
    const dir = this._completedSwipe || this._swipe;
    this._swipe = null;
    this._completedSwipe = null;
    return dir;
  }

  consumeDragEnd() {
    if (!this._dragEnded) return null;
    this._dragEnded = false;
    return { x: this._dragEndX, y: this._dragEndY };
  }
}
