const COLORS = {
  petrol:      '#009999',
  teal:        '#005159',
  lightPetrol: '#00C1B6',
  coral:       '#00CCCC',
  yellow:      '#FFD732',
  yellowBright:'#FFD00F',
  navy:        '#000028',
  darkPanel:   '#23233C',
  midPanel:    '#40405E',
  white:       '#FFFFFF',
  red:         '#D72339',
  focusBlue:   '#199FFF',
};

export { COLORS };

export class SpriteSheet {
  constructor(src, frameW, frameH) {
    this.frameW = frameW;
    this.frameH = frameH;
    this.loaded = false;
    this.image = new Image();
    this.image.src = src;
    this.cols = 0;
    this.rows = 0;
    this.image.onload = () => {
      this.loaded = true;
      this.cols = Math.floor(this.image.width / frameW);
      this.rows = Math.floor(this.image.height / frameH);
    };
  }

  draw(ctx, frameIndex, x, y, flipX = false) {
    if (!this.loaded) return false;
    const col = frameIndex % this.cols;
    const row = Math.floor(frameIndex / this.cols);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (flipX) {
      ctx.translate(x + this.frameW, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }
    ctx.drawImage(
      this.image,
      col * this.frameW, row * this.frameH,
      this.frameW, this.frameH,
      x, y,
      this.frameW, this.frameH
    );
    ctx.restore();
    return true;
  }
}

export class SpriteManager {
  constructor() {
    this.sheets = {};
    this.placeholders = {};
    this.images = {};
  }

  register(name, src, frameW, frameH, placeholderColor) {
    this.sheets[name] = new SpriteSheet(src, frameW, frameH);
    if (placeholderColor) {
      this.placeholders[name] = { color: placeholderColor, w: frameW, h: frameH };
    }
  }

  registerImage(name, src) {
    const entry = { image: new Image(), loaded: false };
    entry.image.onload = () => { entry.loaded = true; };
    entry.image.src = src;
    this.images[name] = entry;
  }

  drawImage(ctx, name, x, y, w, h, flipX = false) {
    const entry = this.images[name];
    if (!entry || !entry.loaded) return false;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (flipX) {
      ctx.translate(x + w, y);
      ctx.scale(-1, 1);
      x = 0;
      y = 0;
    }
    ctx.drawImage(entry.image, x, y, w, h);
    ctx.restore();
    return true;
  }

  getImage(name) {
    const entry = this.images[name];
    if (entry && entry.loaded) return entry.image;
    return null;
  }

  draw(ctx, name, frameIndex, x, y, flipX = false) {
    const sheet = this.sheets[name];
    if (sheet && sheet.draw(ctx, frameIndex, x, y, flipX)) {
      return;
    }
    const ph = this.placeholders[name];
    if (ph) {
      ctx.fillStyle = ph.color;
      ctx.fillRect(x, y, ph.w, ph.h);
    }
  }

  isLoaded(name) {
    const sheet = this.sheets[name];
    if (sheet) return sheet.loaded;
    const img = this.images[name];
    if (img) return img.loaded;
    return false;
  }

  allLoaded() {
    const sheetsOk = Object.values(this.sheets).every(s => s.loaded);
    const imgsOk = Object.values(this.images).every(e => e.loaded);
    return sheetsOk && imgsOk;
  }
}
