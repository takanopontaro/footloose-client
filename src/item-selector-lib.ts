import { IItemEl } from './item-selector-typings';

export const ITEM_SELECTOR_KEY = 'itemSelector' as const;

export function getContext(): Element | null {
  return document.querySelector(`#${ITEM_SELECTOR_KEY}`);
}

export function getActiveItem(): IItemEl | null {
  return getContext()?.querySelector('button[data-active="true"]') ?? null;
}

export function getSiblingItem(item: IItemEl): IItemEl | null {
  const el = item.nextElementSibling ?? item.previousElementSibling;
  return el as IItemEl;
}

export function getItemByIndex(index: number): IItemEl | null {
  const selector = `button[data-index="${index}"]`;
  return getContext()?.querySelector<IItemEl>(selector) ?? null;
}

export function activateItem(
  indexOrEl: number | IItemEl,
  focus: boolean
): boolean {
  const item =
    typeof indexOrEl === 'number' ? getItemByIndex(indexOrEl) : indexOrEl;
  if (!item) {
    return false;
  }
  const attr = 'data-active';
  getContext()
    ?.querySelectorAll(`button[${attr}]`)
    .forEach((el) => el.removeAttribute(attr));
  item.setAttribute(attr, 'true');
  if (focus) {
    item.focus({ preventScroll: true });
  }
  return true;
}

export function reactivateItem(): boolean {
  const item = getActiveItem();
  if (!item) {
    return false;
  }
  item.focus({ preventScroll: true });
  return true;
}

export function hasActiveItem(): boolean {
  return getActiveItem() !== null;
}
