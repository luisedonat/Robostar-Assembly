import { Engine } from './engine.js';
import { Input } from './input.js';
import { SpriteManager } from './sprites.js';
import { UI } from './ui.js';
import { Progress } from './progress.js';
import {
  StateMachine,
  MenuState,
  PlayingState,
  LevelCompleteState,
  GameCompleteState,
} from './states.js';

const loadingBar = document.getElementById('loading-bar');
const loadingScreen = document.getElementById('loading-screen');

function setLoadProgress(pct) {
  if (loadingBar) loadingBar.style.width = `${pct}%`;
}

async function boot() {
  setLoadProgress(10);

  const engine = new Engine('game-canvas');
  setLoadProgress(25);

  const input = new Input(engine.canvas);
  setLoadProgress(40);

  const sprites = new SpriteManager();
  sprites.registerImage('robohead',      'assets/sprites/smallSprites/robohead_small.png');
  sprites.registerImage('robobody',      'assets/sprites/smallSprites/robobody_small.png');
  sprites.registerImage('roboarm_left',  'assets/sprites/smallSprites/roboarm_left_small.png');
  sprites.registerImage('roboarm_right', 'assets/sprites/smallSprites/roboarm_right_small.png');
  sprites.registerImage('roboleg',       'assets/sprites/smallSprites/roboleg_small.png');
  sprites.registerImage('robotFullFront','assets/sprites/robotFullFront.png');
  setLoadProgress(55);

  const ui = new UI();
  const progress = new Progress();
  setLoadProgress(70);

  const sm = new StateMachine();

  sm.register('menu', new MenuState(sm, ui, input, progress));
  sm.register('playing', new PlayingState(sm, ui, input, progress, sprites));
  sm.register('levelComplete', new LevelCompleteState(sm, ui, input, progress));
  sm.register('gameComplete', new GameCompleteState(sm, ui, input, progress));
  setLoadProgress(90);

  sm.change('menu');
  setLoadProgress(100);

  await new Promise(r => setTimeout(r, 400));
  if (loadingScreen) loadingScreen.classList.add('hidden');

  engine.start(
    (dt) => sm.update(dt),
    (ctx) => sm.render(ctx),
  );
}

boot();
