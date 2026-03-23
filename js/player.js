import { COLORS } from './sprites.js';

const GRAVITY = 600;
const MOVE_SPEED = 140;
const JUMP_VELOCITY = -300;
const SPRITE_SIZE = 60;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.width = SPRITE_SIZE;
    this.height = SPRITE_SIZE;
    this.onGround = false;
    this.facingRight = true;

    this.useGravity = true;

    this.parts = {
      head_torso: false,
      arms: false,
      ai_core: false,
    };

    this.abilities = {
      walk: false,
      push: false,
      scan: false,
    };
  }

  unlockPart(name) {
    this.parts[name] = true;
    if (name === 'head_torso') { this.abilities.walk = true; this.abilities.scan = true; }
    if (name === 'arms') this.abilities.push = true;
    if (name === 'ai_core') {} // final part
  }

  syncParts(unlockedParts) {
    for (const part of unlockedParts) {
      this.unlockPart(part);
    }
  }

  update(dt, input, levelBounds) {
    const speed = this.abilities.walk ? MOVE_SPEED : MOVE_SPEED * 0.5;

    if (input.keys.left) {
      this.vx = -speed;
      this.facingRight = false;
    } else if (input.keys.right) {
      this.vx = speed;
      this.facingRight = true;
    } else {
      this.vx = 0;
    }

    if (this.useGravity) {
      if (input.keys.up && this.onGround) {
        this.vy = JUMP_VELOCITY;
        this.onGround = false;
      }
      this.vy += GRAVITY * dt;
    } else {
      if (input.keys.up) this.vy = -speed;
      else if (input.keys.down) this.vy = speed;
      else this.vy = 0;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (levelBounds) {
      if (this.x < levelBounds.left) this.x = levelBounds.left;
      if (this.x + this.width > levelBounds.right) this.x = levelBounds.right - this.width;
      if (this.y + this.height > levelBounds.bottom) {
        this.y = levelBounds.bottom - this.height;
        this.vy = 0;
        this.onGround = true;
      }
      if (this.y < levelBounds.top) this.y = levelBounds.top;
    }
  }

  render(ctx, sprites) {
    const x = Math.round(this.x);
    const y = Math.round(this.y);

    if (sprites && sprites.drawImage(ctx, 'robotFullFront', x, y, this.width, this.height)) {
      return;
    }

    ctx.fillStyle = COLORS.petrol;
    ctx.fillRect(x, y, this.width, this.height);
  }

  get centerX() { return this.x + this.width / 2; }
  get centerY() { return this.y + this.height / 2; }

  get bounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height,
    };
  }
}

export { SPRITE_SIZE };
