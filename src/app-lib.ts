import { AtomEffect, DefaultValue } from 'recoil';
import { INullableElement } from './app-typings';
import { Settings } from './settings';

export const APP_KEY = 'app' as const;

export async function wait(msec: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, msec));
}

export function delay(fn: (...args: unknown[]) => unknown, msec = 10): void {
  window.setTimeout(() => fn(), msec);
}

export function focusAsync(el: INullableElement): void {
  if (el) {
    delay(() => el.focus({ preventScroll: true }));
  }
}

export function toggleHtmlClassName(className: string, force?: boolean): void {
  document.querySelector('html')?.classList.toggle(className, force);
}

declare global {
  interface CSSStyleDeclaration {
    scrollPaddingTop: string;
    scrollPaddingBottom: string;
  }
}

export function getScrollPadding(el: HTMLElement): [number, number] {
  const declaration = window.getComputedStyle(el);
  const top = parseInt(declaration.scrollPaddingTop, 10);
  const bottom = parseInt(declaration.scrollPaddingBottom, 10);
  return [isNaN(top) ? 0 : top, isNaN(bottom) ? 0 : bottom];
}

export function scrollIntoView(
  el: INullableElement,
  frameEl: INullableElement
): void {
  if (!el || !frameEl) {
    return;
  }
  const [scrollPaddingTop, scrollPaddingBottom] = getScrollPadding(frameEl);
  const rect1 = frameEl.getBoundingClientRect();
  const rect2 = el.getBoundingClientRect();
  if (rect1.top + scrollPaddingTop > rect2.top) {
    el.scrollIntoView(true);
  } else if (rect1.bottom - scrollPaddingBottom < rect2.bottom) {
    el.scrollIntoView(false);
  }
}

export function genUid(): string {
  return Math.random().toString(36).substr(2, 8);
}

export function cycleIndex(index: number, total: number, step: number): number {
  index += step;
  if (index >= total) {
    return index % total;
  }
  if (index < 0) {
    return total + (index % total);
  }
  return index;
}

export const focusableElSelector = [
  'a[href]',
  'area[href]',
  'button:not(:disabled)',
  'input:not(:disabled):not([type="hidden"])',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]',
]
  .map((s) => `${s}:not([tabindex^="-"])`)
  .join(',');

export function moveElementFocus(
  context: INullableElement,
  step: number,
  loop = false,
  preventScroll = true
): HTMLElement | undefined {
  if (!context) {
    return;
  }
  const nodeList = context.querySelectorAll<HTMLElement>(focusableElSelector);
  const nodes = Array.from(nodeList);
  let index = nodes.findIndex((e) => e === document.activeElement);
  switch (true) {
    case index === -1: {
      index = 0;
      break;
    }
    case loop: {
      index = cycleIndex(index, nodes.length, step);
      break;
    }
    default: {
      const maxIndex = nodes.length - 1;
      index += step;
      index = index > maxIndex ? maxIndex : index < 0 ? 0 : index;
    }
  }
  nodes[index]?.focus({ preventScroll });
  return nodes[index];
}

export function focusLastElement(
  context: INullableElement,
  preventScroll = true
): void {
  if (!context) {
    return;
  }
  const nodeList = context.querySelectorAll<HTMLElement>(focusableElSelector);
  const nodes = Array.from(nodeList);
  nodes[nodes.length - 1]?.focus({ preventScroll });
}

export function convertToDataAttributes(
  attributes?: Record<string, string>
): Record<string, string> | undefined {
  if (!attributes) {
    return;
  }
  const res: Record<string, string> = {};
  for (const key in attributes) {
    res[`data-${key}`] = attributes[key];
  }
  return res;
}

export function localStorageEffect<T>(key: string): AtomEffect<T> {
  return ({ onSet, setSelf }) => {
    if (Settings.persistent) {
      const savedData = Settings.read<T>(key);
      if (savedData) {
        setSelf(savedData);
      }
    } else {
      Settings.remove(key);
    }
    onSet((newValue) => {
      if (newValue instanceof DefaultValue) {
        return;
      }
      if (Settings.persistent) {
        Settings.save(key, newValue);
      } else {
        Settings.remove(key);
      }
    });
  };
}

export function addClassNamePrefix(
  className: string | null | undefined,
  prefix: string
): string | undefined {
  return className
    ?.trim()
    .split(/\s+/)
    .map((name) => `${prefix}-${name}`)
    .join(' ');
}
