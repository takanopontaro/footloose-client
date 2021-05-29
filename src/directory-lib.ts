import {
  ICopy,
  IEntry,
  IExec,
  IMakeDirectory,
  IMakeVirtualDirectory,
  IMimeType,
  IMove,
  IOpenPath,
  IRealPath,
  IRemove,
  IRename,
  ITar,
  ITouch,
  IUntar,
  IUnzip,
  IZip,
} from 'footloose';
import { getActiveRow } from './active-row';
import { getScrollPadding } from './app-lib';
import { ISort, ISortKey, ISortOrder, ITrEl } from './directory-typings';
import { ICommandParameters, Process } from './process';

export const DIRECTORY_KEY = 'directory' as const;

export const DIRECTORY_ID_LIST = ['directory1', 'directory2'];

export const ERROR_KEY = 'error' as const;

export const VIRTUAL_DIRECTORY_KEY = 'virtualDirectory' as const;

export function getCssCustomProperty(name: string): string {
  const value = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name);
  return value ? JSON.parse(value) : '';
}

export function getEdgeRowEl(
  position: 'top' | 'bottom',
  frameEl: HTMLElement,
  adjustedValue: number
): ITrEl | null {
  const [scrollPaddingTop, scrollPaddingBottom] = getScrollPadding(frameEl);
  const rect = frameEl.getBoundingClientRect();
  const baseY =
    position === 'top'
      ? rect.top + scrollPaddingTop
      : rect.bottom - scrollPaddingBottom;
  const el = document.elementFromPoint(
    rect.left + rect.width / 2,
    baseY + adjustedValue
  );
  const edgeRowEl = el?.closest<ITrEl>('tr');
  if (edgeRowEl) {
    return edgeRowEl;
  }
  const selector = position === 'top' ? 'first-child' : 'last-child';
  return frameEl.querySelector<ITrEl>(`tbody tr:${selector}`);
}

export function scrollPage(
  direction: 'up' | 'down',
  frameEl: HTMLElement,
  activeRowEl: ITrEl
): ITrEl | null {
  const [scrollPaddingTop, scrollPaddingBottom] = getScrollPadding(frameEl);
  const actualFrameElHeight =
    frameEl.offsetHeight - scrollPaddingTop - scrollPaddingBottom;
  const activeRowHeight = activeRowEl.offsetHeight;
  const activeRowTop =
    activeRowEl.offsetTop - scrollPaddingTop - frameEl.scrollTop;
  const activeRowBottom = activeRowTop + activeRowHeight;
  const process = (
    y: number,
    position: Parameters<typeof getEdgeRowEl>[0],
    alignToTop: boolean,
    vector: 1 | -1
  ) => {
    frameEl.scrollBy(0, y);
    const edgeRowEl = getEdgeRowEl(position, frameEl, 1 * vector);
    edgeRowEl?.scrollIntoView(alignToTop);
    return edgeRowEl;
  };
  return direction === 'up'
    ? process(-(actualFrameElHeight - activeRowBottom), 'top', true, 1)
    : process(activeRowTop, 'bottom', false, -1);
}

export function toggleRowSelection(row: ITrEl, force?: boolean): boolean {
  if (row.dataset.parent === 'true') {
    return false;
  }
  const attr = 'aria-selected';
  const selected = row.getAttribute(attr) === 'true';
  const newState = force ?? !selected;
  row.setAttribute(attr, String(newState));
  return newState;
}

export function toggleRowSelectionBy(
  frameId: string,
  indexOrPath: number | string,
  force?: boolean
): boolean {
  const key = typeof indexOrPath === 'number' ? 'index' : 'path';
  const selector = `#${frameId} tbody tr[data-${key}="${indexOrPath}"]`;
  const row = document.querySelector<ITrEl>(selector);
  if (row) {
    return toggleRowSelection(row, force);
  }
  return false;
}

export function toggleRowRangeSelection(
  frameId: string,
  fromIndex: number,
  toIndex: number,
  force?: boolean
): void {
  const n1 = fromIndex > toIndex ? toIndex : fromIndex;
  const n2 = fromIndex > toIndex ? fromIndex : toIndex;
  const selector = `tr:nth-child(n + ${n1 + 1}):nth-child(-n + ${n2 + 1})`;
  document
    .querySelectorAll<ITrEl>(`#${frameId} tbody ${selector}`)
    .forEach((row) => toggleRowSelection(row, force));
}

export function setAllRowSelections(frameId: string, state: boolean): void {
  const attr = 'aria-selected';
  document
    .querySelectorAll<ITrEl>(`#${frameId} tbody tr[${attr}="${!state}"]`)
    .forEach((row) => {
      if (row.dataset.parent === 'false') {
        row.setAttribute(attr, String(state));
      }
    });
}

export function invertAllRowSelections(frameId: string): void {
  document
    .querySelectorAll<ITrEl>(`#${frameId} tbody tr`)
    .forEach((row) => toggleRowSelection(row));
}

export function getAllSelectedRows(frameId: string): ITrEl[] {
  const selector = `#${frameId} tbody tr[aria-selected="true"]`;
  const rows = document.querySelectorAll<ITrEl>(selector);
  return Array.from(rows);
}

export const SORT_ORDERS: ISortOrder[] = ['ascending', 'descending', 'none'];

export function getNextSortOrder(order: ISortOrder): ISortOrder {
  const index = SORT_ORDERS.findIndex((o) => o === order);
  return SORT_ORDERS[(index + 1) % SORT_ORDERS.length];
}

export function getSortOrder(key: ISortKey, sorts: ISort[]): ISortOrder {
  return sorts.find((sort) => sort.key === key)?.order ?? 'none';
}

export function setSort(
  key: ISortKey,
  order: ISortOrder,
  sorts: ISort[]
): ISort[] {
  sorts = sorts.filter((sort) => sort.key !== key);
  if (order !== 'none') {
    sorts.push({ key, order });
  }
  return sorts;
}

export function toggleSort(key: ISortKey, sorts: ISort[]): ISort[] {
  const sort = sorts.find((sort) => sort.key === key);
  const current: ISortOrder = sort ? sort.order : 'none';
  const nextOrder = getNextSortOrder(current);
  return setSort(key, nextOrder, sorts);
}

export function sortEntries(entries: IEntry[], sorts: ISort[]): IEntry[] {
  entries = [...entries];
  sorts.forEach(({ key, order }) => {
    const num = order === 'ascending' ? -1 : 1;
    entries.sort((a, b) => {
      if (a.parent) {
        return -1;
      }
      if (a[key] === b[key]) {
        return 0;
      }
      return a[key] > b[key] ? -1 * num : 1 * num;
    });
  });
  return entries;
}

export function copyText(text: string): void {
  const el = document.createElement('textarea');
  el.classList.add('tempTextarea');
  document.body.appendChild(el);
  el.value = text;
  el.select();
  document.execCommand('copy');
  el.remove();
}

export function copyItemPaths(frameId: string): void {
  const activeRow = getActiveRow(frameId);
  const selectedRows = getAllSelectedRows(frameId);
  const paths =
    selectedRows.length > 0
      ? selectedRows.map((row) => row.dataset.path)
      : [activeRow.path];
  const activeEl = document.activeElement;
  copyText(paths.join('\n'));
  (activeEl as HTMLElement)?.focus({ preventScroll: true });
}

export function copy(parameters: ICommandParameters<ICopy>): Process<ICopy> {
  const process = new Process<ICopy>('cp', parameters);
  process.run();
  return process;
}

export function move(parameters: ICommandParameters<IMove>): Process<IMove> {
  const process = new Process<IMove>('mv', parameters);
  process.run();
  return process;
}

export function zip(parameters: ICommandParameters<IZip>): Process<IZip> {
  const process = new Process<IZip>('zip', parameters);
  process.run();
  return process;
}

export function tar(parameters: ICommandParameters<ITar>): Process<ITar> {
  const process = new Process<ITar>('tar', parameters);
  process.run();
  return process;
}

export function unzip(parameters: ICommandParameters<IUnzip>): Process<IUnzip> {
  const process = new Process<IUnzip>('unzip', parameters);
  process.run();
  return process;
}

export function untar(parameters: ICommandParameters<IUntar>): Process<IUntar> {
  const process = new Process<IUntar>('untar', parameters);
  process.run();
  return process;
}

export function remove(
  parameters: ICommandParameters<IRemove>
): Process<IRemove> {
  const process = new Process<IRemove>('rm', parameters);
  process.run();
  return process;
}

export function makeDirectory(
  parameters: ICommandParameters<IMakeDirectory>
): Process<IMakeDirectory> {
  const process = new Process<IMakeDirectory>('mkdir', parameters);
  process.run();
  return process;
}

export function makeVirtualDirectory(
  parameters: ICommandParameters<IMakeVirtualDirectory>
): Process<IMakeVirtualDirectory> {
  const process = new Process<IMakeVirtualDirectory>('vd', parameters);
  process.run();
  return process;
}

export function touch(parameters: ICommandParameters<ITouch>): Process<ITouch> {
  const process = new Process<ITouch>('touch', parameters);
  process.run();
  return process;
}

export function rename(
  parameters: ICommandParameters<IRename>
): Process<IRename> {
  const process = new Process<IRename>('rename', parameters);
  process.run();
  return process;
}

export function openPath(
  parameters: ICommandParameters<IOpenPath>
): Process<IOpenPath> {
  const process = new Process<IOpenPath>('open', parameters);
  process.run();
  return process;
}

export function realPath(
  parameters: ICommandParameters<IRealPath>
): Process<IRealPath> {
  const process = new Process<IRealPath>('realpath', parameters);
  process.run();
  return process;
}

export function mimeType(
  parameters: ICommandParameters<IMimeType>
): Process<IMimeType> {
  const process = new Process<IMimeType>('mimetype', parameters);
  process.run();
  return process;
}

export function exec(parameters: ICommandParameters<IExec>): Process<IExec> {
  const process = new Process<IExec>('exec', parameters);
  process.run();
  return process;
}

export const rawApi = {
  getCssCustomProperty,
  copyText,
  copy,
  move,
  zip,
  tar,
  unzip,
  untar,
  remove,
  makeDirectory,
  makeVirtualDirectory,
  touch,
  rename,
  openPath,
  realPath,
  mimeType,
  exec,
};
