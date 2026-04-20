import { createLevel } from './level.js';
import { PARTS, LEVEL_NAMES, Leaderboard } from './progress.js';
import { playLevelComplete, playVictory, unlockAudio } from './audio.js';

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

  enter() {
    // Blur name input when re-entering menu
    this.ui._nameFieldFocused = false;
  }
  exit() {
    // Hide keyboard when leaving menu
    if (this.ui._nameInput) {
      this.ui._nameInput.blur();
      this.ui._nameInput.style.pointerEvents = 'none';
    }
    this.ui._nameFieldFocused = false;
  }

  update(dt) {
    this.ui.update(dt);
    if (this.input.tap) {
      const tx = this.input.tapX;
      const ty = this.input.tapY;
      // Check if tap hit the name field
      if (this.ui.handleNameFieldTap(tx, ty)) {
        this.input.consumeTap();
        return;
      }
    }
    if (this.input.consumeTap() || this.input.keys.action) {
  this.input.keys.action = false;
  // Don't start game if name field is focused — just unfocus
  if (this.ui._nameFieldFocused) {
    this.ui._nameFieldFocused = false;
    if (this.ui._nameInput) this.ui._nameInput.blur();
    return;
  }
  unlockAudio();
  this.input.requestTiltPermission();
  this.input.requestFullscreen();
      this.progress.reset();
      this.sm.change('playing', { levelIndex: 0 });
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

    // Check for mute button taps before passing input to level
    if (this.input.tap) {
      if (this.ui.handleHUDTap(this.input.tapX, this.input.tapY)) {
        this.input.consumeTap();
      }
    }

    this.level.update(dt, this.input);

    if (this.level.isComplete()) {
      const idx = this.level.index;
      const time = this.level.timerMs;
      this.progress.completeLevel(idx, time);
      if (this.progress.allComplete) {
        playVictory();
        this.sm.change('gameComplete');
      } else {
        playLevelComplete();
        const next = this.progress.nextLevelIndex;
        this.sm.change('levelTransition', { levelIndex: next });
      }
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

/* ---- Level Transition State ---- */

const TRANSITION_DURATION = 2.5; // seconds

export class LevelTransitionState {
  constructor(sm, ui, input, progress) {
    this.sm = sm;
    this.ui = ui;
    this.input = input;
    this.progress = progress;
    this._levelIndex = 0;
    this._timer = 0;
  }

  enter(params) {
    this._levelIndex = params.levelIndex ?? 0;
    this._timer = 0;
    this.input.consumeTap();
    // Show loading overlay and reset its bar
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    if (loadingScreen) loadingScreen.classList.remove('hidden');
    if (loadingBar) loadingBar.style.width = '0%';
  }

  exit() {}

  update(dt) {
    this.ui.update(dt);
    this._timer += dt;
    // Animate the loading bar
    const pct = Math.min(this._timer / TRANSITION_DURATION, 1) * 100;
    const loadingBar = document.getElementById('loading-bar');
    if (loadingBar) loadingBar.style.width = `${pct}%`;
    if (this._timer >= TRANSITION_DURATION) {
      // Hide loading overlay before starting next minigame
      const loadingScreen = document.getElementById('loading-screen');
      if (loadingScreen) loadingScreen.classList.add('hidden');
      this.sm.change('playing', { levelIndex: this._levelIndex });
    }
  }

  render(ctx) {
    // HTML overlay covers the canvas — nothing to draw
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
    this._inputDelay = 0;
  }

  enter() {
    this._inputDelay = 0.8;
    this.input.consumeTap();
    this.input.consumeDragEnd();

    // Save to leaderboard
    if (this.ui._leaderboard) {
      const name = this.ui._playerName || 'Anonymous';
      const rank = this.ui._leaderboard.addEntry(name, this.progress.totalTime);
      this.ui._lastRank = rank;
    }
  }

  exit() {}

  update(dt) {
    this.ui.update(dt);
    if (this._inputDelay > 0) {
      this._inputDelay -= dt;
      this.input.consumeTap();
      return;
    }
    if (this.input.consumeTap() || this.input.keys.action) {
  this.input.keys.action = false;
  // Check if tap hit the mobile feedback link
  if (this.ui.handleLinkTap(this.input.tapX, this.input.tapY)) return;
  this.progress.reset();
  this.sm.change('menu');
    }
  }

  render(ctx) {
    this.ui.drawGameComplete(ctx, this.progress);
  }
}
