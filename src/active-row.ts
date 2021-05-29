import { toggleRowSelection } from './directory-lib';
import { ITrEl } from './directory-typings';
import { useAdjustScrollPosition } from './frame-hooks';

const activeRows = new Map<string, ActiveRow>();

class ActiveRow {
  attr = 'data-active';
  frameId: string;
  index = -1;
  path = '';
  el?: ITrEl;
  adjustScrollPosition?: ReturnType<typeof useAdjustScrollPosition>;
  #context?: Element;

  constructor(frameId: string) {
    this.frameId = frameId;
  }

  get context(): Element | undefined {
    if (this.#context) {
      return this.#context;
    }
    const el = document.querySelector(`#${this.frameId} tbody`) ?? undefined;
    this.#context = el;
    return el;
  }

  activate(indexOrPath: number | string): boolean {
    const key = typeof indexOrPath === 'number' ? 'index' : 'path';
    const selector = `tr[data-${key}="${indexOrPath}"]`;
    const row = this.context?.querySelector<ITrEl>(selector);
    if (!row) {
      this.index = -1;
      this.path = '';
      this.el = undefined;
      return false;
    }
    this.context
      ?.querySelectorAll(`tr[${this.attr}]`)
      .forEach((el) => el.removeAttribute(this.attr));
    row.setAttribute(this.attr, 'true');
    this.index = +row.dataset.index;
    this.path = row.dataset.path;
    this.el = row;
    this.adjustScrollPosition?.(this.frameId, row);
    return true;
  }

  reactivate(): boolean {
    return this.activate(this.path);
  }

  toggleSelection(force?: boolean): boolean {
    if (this.el) {
      return toggleRowSelection(this.el, force);
    }
    return false;
  }
}

function getActiveRow(frameId: string): ActiveRow {
  const activeRow = activeRows.get(frameId) ?? new ActiveRow(frameId);
  activeRows.set(frameId, activeRow);
  return activeRow;
}

export { getActiveRow, ActiveRow };
