const STORAGE_KEY = 'robostar_save';

const PARTS = ['head_torso', 'arms', 'ai_core'];

const LEVEL_NAMES = [
  'Design & Engineering',
  'Manufacturing',
  'Software & Deployment',
];

function defaultData() {
  return {
    levelsCompleted: [false, false, false],
    bestTimes: [null, null, null],
    partsUnlocked: [false, false, false],
    cumulativeTimeMs: 0,
  };
}

export class Progress {
  constructor() {
    this.data = defaultData();
    this.runTimeMs = 0;
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        this.data.levelsCompleted = saved.levelsCompleted || this.data.levelsCompleted;
        this.data.bestTimes = saved.bestTimes || this.data.bestTimes;
        this.data.partsUnlocked = saved.partsUnlocked || this.data.partsUnlocked;
        this.data.cumulativeTimeMs = saved.cumulativeTimeMs || 0;
      }
    } catch (_) {
      this.data = defaultData();
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (_) { /* storage unavailable */ }
  }

  reset() {
    this.data = defaultData();
    this.runTimeMs = 0;
    this.save();
  }

  completeLevel(index, timeMs) {
    this.data.levelsCompleted[index] = true;
    this.data.partsUnlocked[index] = true;

    const prev = this.data.bestTimes[index];
    if (prev === null || timeMs < prev) {
      this.data.bestTimes[index] = timeMs;
    }
    this.runTimeMs += timeMs;
    this.data.cumulativeTimeMs = this.runTimeMs;
    this.save();
  }

  isLevelUnlocked(index) {
    if (index === 0) return true;
    return this.data.levelsCompleted[index - 1];
  }

  isLevelCompleted(index) {
    return this.data.levelsCompleted[index];
  }

  hasPart(partName) {
    const i = PARTS.indexOf(partName);
    return i >= 0 && this.data.partsUnlocked[i];
  }

  get unlockedParts() {
    return PARTS.filter((_, i) => this.data.partsUnlocked[i]);
  }

  get allComplete() {
    return this.data.levelsCompleted.every(Boolean);
  }

  get totalTime() {
    return this.data.bestTimes.reduce((sum, t) => sum + (t || 0), 0);
  }

  get nextLevelIndex() {
    const idx = this.data.levelsCompleted.indexOf(false);
    return idx === -1 ? -1 : idx;
  }
}

export { PARTS, LEVEL_NAMES };

/* ---- Leaderboard ---- */

const LB_KEY = 'robostar_leaderboard';
const MAX_ENTRIES = 10;

export class Leaderboard {
  constructor() {
    this.entries = []; // { name, time }
    this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(LB_KEY);
      if (raw) this.entries = JSON.parse(raw);
    } catch (_) {
      this.entries = [];
    }
  }

  save() {
    try {
      localStorage.setItem(LB_KEY, JSON.stringify(this.entries));
    } catch (_) { /* storage unavailable */ }
  }

  addEntry(name, totalTimeMs) {
    this.entries.push({ name: name || 'Anonymous', time: totalTimeMs });
    this.entries.sort((a, b) => a.time - b.time);
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }
    this.save();
    return this.getRank(totalTimeMs, name);
  }

  /** Get rank (1-based) of a specific time. Returns the position of the last-added entry with that name+time. */
  getRank(totalTimeMs, name) {
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].time === totalTimeMs && this.entries[i].name === name) {
        return i + 1;
      }
    }
    return -1;
  }

  getTop(n = 5) {
    return this.entries.slice(0, n);
  }
}
