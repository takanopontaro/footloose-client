import Mousetrap, { MousetrapInstance } from 'mousetrap';

type IKeyBindings = Record<
  string,
  (combo: string, e: KeyboardEvent) => unknown
>;

const shortcuts = new Map<string, Shortcut>();

class Shortcut {
  mousetrap: MousetrapInstance;
  pause = false;

  constructor(el?: Element) {
    this.mousetrap = new Mousetrap(el);
    this.mousetrap.stopCallback = this.stopCallback.bind(this);
  }

  stopCallback(e: Event, el: Element): boolean {
    if (this.pause) {
      return true;
    }
    if (el.classList.contains('mousetrap')) {
      return false;
    }
    return (
      el.tagName === 'INPUT' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'TEXTAREA'
    );
  }

  bind(keyBindings: IKeyBindings): void {
    this.mousetrap.reset();
    for (const keyStr in keyBindings) {
      keyStr
        .split(/,/)
        .map((key) => key.trim().replace(/comma/g, ','))
        .forEach((key) => {
          this.mousetrap.bind(key, (e, combo) => {
            const through = keyBindings[keyStr](combo, e);
            return through === true;
          });
        });
    }
  }

  destroy(): void {
    this.mousetrap.reset();
  }
}

function getShortcut(key: string, el?: Element): Shortcut {
  const shortcut = shortcuts.get(key) ?? new Shortcut(el);
  shortcuts.set(key, shortcut);
  return shortcut;
}

function deleteShortcut(key: string): void {
  const shortcut = shortcuts.get(key);
  if (shortcut) {
    shortcut.destroy();
    shortcuts.delete(key);
  }
}

function setAllShortcutsSuspensions(
  pause: boolean,
  exceptions: string[] = []
): void {
  if (pause) {
    setAllShortcutsSuspensions(false);
  }
  shortcuts.forEach((shortcut, key) => {
    if (!exceptions.includes(key)) {
      shortcut.pause = pause;
    }
  });
}

export {
  getShortcut,
  deleteShortcut,
  Shortcut,
  setAllShortcutsSuspensions,
  IKeyBindings,
};
