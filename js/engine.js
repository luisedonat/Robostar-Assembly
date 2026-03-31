const GAME_WIDTH = 390;
const GAME_HEIGHT = 844;
const TILE_SIZE = 32;
const FPS = 60;
const FRAME_TIME = 1000 / FPS;

export class Engine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    this._lastTime = 0;
    this._accumulator = 0;
    this._running = false;
    this._rafId = null;

    this.updateFn = null;
    this.renderFn = null;

    this._setupCanvas();
    window.addEventListener('resize', () => this._setupCanvas());
  }

  _setupCanvas() {
    const dpr = window.devicePixelRatio || 1;

    // Set the backing store to the full physical resolution
    this.canvas.width = GAME_WIDTH * dpr;
    this.canvas.height = GAME_HEIGHT * dpr;

    // Set CSS size to exactly the logical game size — the responsive
    // CSS rules (max-width / max-height / aspect-ratio) will still
    // constrain this, so it won't overflow.
    this.canvas.style.width = GAME_WIDTH + 'px';
    this.canvas.style.height = GAME_HEIGHT + 'px';

    // Scale the context so all drawing code uses logical coordinates
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  start(updateFn, renderFn) {
    this.updateFn = updateFn;
    this.renderFn = renderFn;
    this._running = true;
    this._lastTime = performance.now();
    this._accumulator = 0;
    this._tick(this._lastTime);
  }

  stop() {
    this._running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _tick(now) {
    if (!this._running) return;

    const delta = now - this._lastTime;
    this._lastTime = now;

    this._accumulator += Math.min(delta, 200);

    while (this._accumulator >= FRAME_TIME) {
      if (this.updateFn) {
        this.updateFn(FRAME_TIME / 1000);
      }
      this._accumulator -= FRAME_TIME;
    }

    this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    if (this.renderFn) {
      this.renderFn(this.ctx);
    }

    this._rafId = requestAnimationFrame((t) => this._tick(t));
  }

  get width() { return GAME_WIDTH; }
  get height() { return GAME_HEIGHT; }
}

export { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE };
