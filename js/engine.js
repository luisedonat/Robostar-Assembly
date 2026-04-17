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
    const dpr = Math.max(window.devicePixelRatio || 1, 1);

    // Compute a uniform scale that fits the logical game area into the
    // available viewport while preserving aspect ratio. This allows the
    // canvas to expand to very large screens (4K) while keeping the
    // game's logical coordinate system at GAME_WIDTH×GAME_HEIGHT.
    const availW = window.innerWidth;
    const availH = window.innerHeight;
    const scaleW = availW / GAME_WIDTH;
    const scaleH = availH / GAME_HEIGHT;
    const scale = Math.max( Math.min(scaleW, scaleH), 1 ); // at least 1x

    // CSS pixels size (how big it appears on screen)
    const cssW = Math.round(GAME_WIDTH * scale);
    const cssH = Math.round(GAME_HEIGHT * scale);

    // Backing store size in physical pixels for crisp HiDPI rendering
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);

    // Set CSS size so the canvas scales to fill the viewport area computed
    this.canvas.style.width = cssW + 'px';
    this.canvas.style.height = cssH + 'px';

    // Transform the context so the game's drawing code can continue to use
    // logical coordinates (0..GAME_WIDTH, 0..GAME_HEIGHT). We combine DPR
    // and our UI scale into a single transform.
    const totalScale = dpr * scale;
    this.ctx.setTransform(totalScale, 0, 0, totalScale, 0, 0);
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
