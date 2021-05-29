import { Settings } from './settings';
import { VirtualDirectories } from './virtual-directories';

const histories = new Map<string, History>();

class History {
  maxIndex = 1000;
  key: string;
  currentIndex = -1;
  previousPath = '';
  paths: string[] = [];

  constructor(frameId: string) {
    this.key = `history.${frameId}`;
    if (Settings.persistent) {
      this.load();
    }
  }

  get length(): number {
    return this.paths.length;
  }

  get current(): string {
    return this.paths[this.currentIndex] ?? '';
  }

  get previous(): string {
    return this.previousPath;
  }

  push(path: string): string {
    this.previousPath = this.current;
    const index = this.paths.indexOf(path);
    if (index !== -1) {
      const [removed] = this.paths.splice(index, 1);
      this.paths.push(removed);
    } else {
      this.paths.push(path);
    }
    if (this.length >= this.maxIndex) {
      this.delete(0);
    }
    this.currentIndex = this.paths.length - 1;
    this.save();
    return path;
  }

  go(index: number): string {
    if (index === this.currentIndex || index < 0 || index > this.length - 1) {
      return '';
    }
    this.currentIndex = index;
    this.save();
    return this.paths[this.currentIndex];
  }

  goBy(step: number): string {
    if (step < 0) {
      return this.back(Math.abs(step));
    }
    if (step > 0) {
      return this.forward(step);
    }
    return this.current;
  }

  back(step: number): string {
    if (this.currentIndex <= 0) {
      return '';
    }
    this.previousPath = this.current;
    this.currentIndex -= step;
    if (this.currentIndex < 0) {
      this.currentIndex = 0;
    }
    this.save();
    return this.paths[this.currentIndex];
  }

  forward(step: number): string {
    const maxIndex = this.length - 1;
    if (this.currentIndex === maxIndex) {
      return '';
    }
    this.previousPath = this.current;
    this.currentIndex += step;
    if (this.currentIndex > maxIndex) {
      this.currentIndex = maxIndex;
    }
    this.save();
    return this.paths[this.currentIndex];
  }

  delete(indexOrPath: number | string): void {
    const index =
      typeof indexOrPath === 'number'
        ? indexOrPath
        : this.paths.findIndex((path) => path === indexOrPath);
    if (this.paths[index] === undefined) {
      return;
    }
    this.previousPath = this.current;
    this.paths.splice(index, 1);
    if (index <= this.currentIndex) {
      this.currentIndex--;
    }
    if (this.currentIndex === -1 && this.length > 0) {
      this.currentIndex = 0;
    }
    this.save();
  }

  deleteCurrent(): void {
    this.delete(this.currentIndex);
  }

  serialize(): string[] {
    return this.paths;
  }

  save(): void {
    Settings.save(this.key, this.serialize());
  }

  load(): void {
    const paths = Settings.read(this.key, []);
    this.paths = paths.filter((path) => !VirtualDirectories.includes(path));
    VirtualDirectories.clear();
  }
}

function getHistory(frameId: string): History {
  const history = histories.get(frameId) ?? new History(frameId);
  histories.set(frameId, history);
  return history;
}

export { getHistory, History };
