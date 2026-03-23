import { createLevel } from './level.js';
import { PARTS } from './progress.js';

export class StateMachine {
  constructor() {
    this._states = {};
    this._current = null;
    this._currentName = null;
  }

  register(name, state) {
    this._states[name] = state;
  }

  change(name, params = {}) {
    if (this._current && this._current.exit) {
      this._current.exit();
    }
    this._currentName = name;
    this._current = this._states[name];
    if (this._current && this._current.enter) {
      this._current.enter(params);
    }
  }

  update(dt) {
    if (this._current && this._current.update) {
      this._current.update(dt);
    }
  }

  render(ctx) {
    if (this._current && this._current.render) {
      this._current.render(ctx);
    }
  }

  get currentName() {
    return this._currentName;
  }
}

/* ---- Menu State ---- */

export class MenuState {
  constructor(sm, ui, input, progress) {
    this.sm = sm;
    this.ui = ui;
    this.input = input;
    this.progress = progress;
  }

  enter() {}
  exit() {}

  update(dt) {
    this.ui.update(dt);
    if (this.input.consumeTap() || this.input.keys.action) {
      this.input.keys.action = false;
      this.progress.reset();
      const nextIdx = 0;
      this.sm.change('playing', { levelIndex: nextIdx });
    }
  }

  render(ctx) {
    this.ui.drawMenuScreen(ctx);
  }
}

/* ---- Playing State ---- */

export class PlayingState {
  constructor(sm, ui, input, progress, sprites) {
    this.sm = sm;
    this.ui = ui;
    this.input = input;
    this.progress = progress;
    this.sprites = sprites;
    this.level = null;
  }

  enter(params) {
    const idx = params.levelIndex ?? 0;
    this.level = createLevel(idx);
    this.level.init(this.progress);
  }

  exit() {
    this.level = null;
  }

  update(dt) {
    this.ui.update(dt);
    if (!this.level) return;

    this.level.update(dt, this.input);

    if (this.level.isComplete()) {
      const idx = this.level.index;
      const time = this.level.timerMs;
      this.progress.completeLevel(idx, time);
      this.sm.change('levelComplete', {
        levelIndex: idx,
        timeMs: time,
        partName: PARTS[idx],
      });
    }
  }

  render(ctx) {
    if (!this.level) return;
    this.level.render(ctx, this.sprites);

    const parts = [
      this.progress.hasPart('head_torso'),
      this.progress.hasPart('arms'),
      this.progress.hasPart('ai_core'),
    ];
    this.ui.drawHUD(ctx, this.level.name, this.progress.runTimeMs + this.level.timerMs, parts);
  }
}

/* ---- Level Complete State ---- */

export class LevelCompleteState {
  constructor(sm, ui, input, progress) {
    this.sm = sm;
    this.ui = ui;
    this.input = input;
    this.progress = progress;
    this._levelIndex = 0;
    this._timeMs = 0;
    this._partName = '';
  }

  enter(params) {
    this._levelIndex = params.levelIndex;
    this._timeMs = params.timeMs;
    this._partName = params.partName;
  }

  exit() {}

  update(dt) {
    this.ui.update(dt);
    if (this.input.consumeTap() || this.input.keys.action) {
      this.input.keys.action = false;
      if (this.progress.allComplete) {
        this.sm.change('gameComplete');
      } else {
        const next = this.progress.nextLevelIndex;
        this.sm.change('playing', { levelIndex: next });
      }
    }
  }

  render(ctx) {
    this.ui.drawLevelComplete(ctx, this._levelIndex, this._timeMs, this._partName);
  }
}

/* ---- Game Complete State ---- */

export class GameCompleteState {
  constructor(sm, ui, input, progress) {
    this.sm = sm;
    this.ui = ui;
    this.input = input;
    this.progress = progress;
  }

  enter() {}
  exit() {}

  update(dt) {
    this.ui.update(dt);
    if (this.input.consumeTap() || this.input.keys.action) {
      this.input.keys.action = false;
      this.progress.reset();
      this.sm.change('menu');
    }
  }

  render(ctx) {
    this.ui.drawGameComplete(ctx, this.progress);
  }
}
