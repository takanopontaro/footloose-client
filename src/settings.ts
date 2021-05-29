class SettingsClass {
  key = 'persistentSettings';
  #persistent: boolean;

  constructor() {
    this.#persistent = this.read(this.key, false);
  }

  get persistent(): boolean {
    return this.#persistent;
  }

  set persistent(value: boolean) {
    this.#persistent = value;
    if (value) {
      window.localStorage.setItem(this.key, 'true');
    } else {
      this.clear();
    }
  }

  save(key: string, data: unknown): void {
    if (!this.#persistent) {
      return;
    }
    window.requestAnimationFrame(() => {
      window.localStorage.setItem(key, JSON.stringify(data));
    });
  }

  remove(key: string): void {
    if (key !== this.key) {
      window.requestAnimationFrame(() => window.localStorage.removeItem(key));
    }
  }

  clear(): void {
    window.localStorage.clear();
    window.localStorage.setItem(this.key, 'false');
  }

  read<T>(key: string, defaultData?: T): T {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultData;
  }
}

const Settings = new SettingsClass();

export { Settings };
