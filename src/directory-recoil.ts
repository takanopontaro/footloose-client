import { IEntry, IOpenPathApp } from 'footloose';
import { atom, atomFamily, selectorFamily } from 'recoil';
import { localStorageEffect } from './app-lib';
import { DIRECTORY_ID_LIST, sortEntries } from './directory-lib';
import { IPreviewMaker, ISort } from './directory-typings';
import { FakeRef } from './fake-ref';
import { VirtualDirectories } from './virtual-directories';

export const selectedRowsOnlyState = atom<boolean>({
  key: 'directory/selectedRowsOnly',
  default: false,
});

export const openPathAppsState = atom<Record<string, IOpenPathApp>>({
  key: 'directory/openPathApps',
  default: {},
});

export const previewMakerState = atomFamily<IPreviewMaker, string>({
  key: 'directory/previewMaker',
  default: () => '',
});

export const activeDirectoryFrameIdState = atom<string>({
  key: 'directory/activeDirectoryFrameId',
  default: DIRECTORY_ID_LIST[0],
});

export const targetDirectoryFrameIdState = selectorFamily<string, string>({
  key: 'directory/targetDirectoryFrameId',
  get: (frameId) => () =>
    DIRECTORY_ID_LIST.filter((frmId) => frmId !== frameId)[0],
});

export const directoryPathState = atomFamily<string, string>({
  key: 'directory/directoryPath',
  default: '',
  effects_UNSTABLE: (frameId) => [
    localStorageEffect(`directoryPath.${frameId}`),
  ],
});

export const nextDirectoryPathState = atomFamily<string, string>({
  key: 'directory/nextDirectoryPath',
  default: '',
});

export const displayDirectoryPathState = selectorFamily<string, string>({
  key: 'directory/displayDirectoryPath',
  get:
    (frameId) =>
    ({ get }) => {
      const path = get(directoryPathState(frameId));
      return VirtualDirectories.convert(path);
    },
});

export const directoryStatusState = atomFamily<string, string>({
  key: 'directory/directoryStatus',
  default: '',
});

export const entrySortsState = atomFamily<ISort[], string>({
  key: 'directory/entrySorts',
  default: [],
  effects_UNSTABLE: (frameId) => [localStorageEffect(`entrySorts.${frameId}`)],
});

export const entryFilterState = atomFamily<string, string>({
  key: 'directory/entryFilter',
  default: '',
  effects_UNSTABLE: (frameId) => [localStorageEffect(`entryFilter.${frameId}`)],
});

export const defaultEntryFilterState = atomFamily<string, string>({
  key: 'directory/defaultEntryFilter',
  default: '',
  effects_UNSTABLE: (frameId) => [
    localStorageEffect(`defaultEntryFilter.${frameId}`),
  ],
});

export const originalEntriesState = atomFamily<IEntry[], string>({
  key: 'directory/originalEntries',
  default: [],
});

export const filteredEntriesState = selectorFamily<IEntry[], string>({
  key: 'directory/filteredEntries',
  get:
    (frameId) =>
    ({ get }) => {
      const entries = get(originalEntriesState(frameId));
      const defaultFilter = get(defaultEntryFilterState(frameId));
      const filter = get(entryFilterState(frameId)).trim();
      if (!defaultFilter && !filter) {
        return entries;
      }
      try {
        return [defaultFilter, filter].reduce((filteredEntries, filterStr) => {
          if (!filterStr) {
            return filteredEntries;
          }
          const re = new RegExp(filterStr, 'i');
          return filteredEntries.filter(
            (entry) => entry.parent || re.test(`${entry.name}${entry.ext}`)
          );
        }, entries);
      } catch (e) {
        return entries;
      }
    },
});

export const sortedEntriesState = selectorFamily<IEntry[], string>({
  key: 'directory/sortedEntries',
  get:
    (frameId) =>
    ({ get }) => {
      const entries = get(filteredEntriesState(frameId));
      const sorts = get(entrySortsState(frameId));
      return sortEntries(entries, sorts);
    },
});

// RefObject を使いたいところだが RecoilState にすると current が read-only になってしまうので偽物を使う
export const originalEntriesRefState = atomFamily<FakeRef<IEntry[]>, string>({
  key: 'directory/originalEntriesRef',
  default: () => new FakeRef([]),
});

// RefObject を使いたいところだが RecoilState にすると current が read-only になってしまうので偽物を使う
export const sortedEntriesRefState = atomFamily<FakeRef<IEntry[]>, string>({
  key: 'directory/sortedEntriesRef',
  default: () => new FakeRef([]),
});
