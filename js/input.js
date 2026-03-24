const SWIPE_THRESHOLD = 30;

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

    this._bindKeyboard();
    this._bindPointer();
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
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
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

      const half = this.canvas.width / 2;
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
