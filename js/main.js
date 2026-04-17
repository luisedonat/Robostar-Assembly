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
  sprites.registerImage('robostarFront', 'assets/sprites/2026_Robostar_front_03.png');
  setLoadProgress(55);

  const ui = new UI(sprites);
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

  // Hold loading screen for ~4 seconds so the credit text is readable
  // Animate the bar smoothly across the wait
  const loadStart = performance.now();
  const LOAD_DURATION = 4000;
  await new Promise(resolve => {
    function tick() {
      const elapsed = performance.now() - loadStart;
      if (elapsed >= LOAD_DURATION) {
        setLoadProgress(100);
        resolve();
        return;
      }
      // Bar goes from 90→100 during the cosmetic wait
      setLoadProgress(90 + (elapsed / LOAD_DURATION) * 10);
      requestAnimationFrame(tick);
    }
    tick();
  });
  if (loadingScreen) loadingScreen.classList.add('hidden');

  engine.start(
    (dt) => sm.update(dt),
    (ctx) => sm.render(ctx),
  );
}

boot();
