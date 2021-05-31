import { IEntry, IOpenPathApp } from 'footloose';
import { MouseEvent, useCallback, useEffect, useMemo } from 'react';
import {
  RecoilState,
  RecoilValueReadOnly,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { ActiveRow, getActiveRow } from './active-row';
import { useGetRecoilValue } from './app-hooks';
import { cycleIndex } from './app-lib';
import { persistentSettingsState } from './app-recoil';
import { ISettings, OmitFirstParameter } from './app-typings';
import { Bookmark } from './bookmark';
import {
  Connection,
  IConnectionDirectoryError,
  IConnectionDirectoryUpdate,
} from './connection';
import { useDialog } from './dialog-hooks';
import {
  DIRECTORY_ID_LIST,
  DIRECTORY_KEY,
  ERROR_KEY,
  VIRTUAL_DIRECTORY_KEY,
  copy,
  copyItemPaths,
  copyText,
  getAllSelectedRows,
  invertAllRowSelections,
  makeDirectory,
  makeVirtualDirectory,
  move,
  openPath,
  rawApi,
  realPath,
  remove,
  rename,
  scrollPage,
  setAllRowSelections,
  setSort,
  tar,
  toggleRowRangeSelection,
  toggleRowSelection,
  toggleRowSelectionBy,
  toggleSort,
  touch,
  untar,
  unzip,
  zip,
} from './directory-lib';
import {
  activeDirectoryFrameIdState,
  defaultEntryFilterState,
  directoryPathState,
  directoryStatusState,
  entryFilterState,
  entrySortsState,
  nextDirectoryPathState,
  openPathAppsState,
  originalEntriesRefState,
  originalEntriesState,
  parentDirectoryPathState,
  previewMakerState,
  selectedRowsOnlyState,
  sortedEntriesRefState,
  sortedEntriesState,
  targetDirectoryFrameIdState,
} from './directory-recoil';
import {
  IPreviewMaker,
  ISort,
  ISortKey,
  ISortOrder,
  IThEl,
  ITrEl,
} from './directory-typings';
import { FakeRef } from './fake-ref';
import { useFocusFilterInput as useFocusFilterInputHook } from './filter-input-hooks';
import { useAdjustScrollPosition, useFocusFrame } from './frame-hooks';
import { createFrameTypeListSetter } from './frame-lib';
import {
  focusListenerState,
  frameElState,
  frameTypeListState,
} from './frame-recoil';
import { History, getHistory } from './history';
import { useWriteLog } from './log-hooks';
import { VirtualDirectories } from './virtual-directories';

export function useGetDirectoryRecoilValue<T>(
  recoilState: (frameId: string) => RecoilState<T> | RecoilValueReadOnly<T>
): (frameId?: string) => Promise<T> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useRecoilCallback(
    ({ snapshot }) =>
      async (frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        return await snapshot.getPromise(recoilState(frameId));
      },
    [getActiveFrameId, recoilState]
  );
}

export function useSetPreviewMaker(): (
  value: IPreviewMaker,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useRecoilCallback(
    ({ set }) =>
      async (value, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        set(previewMakerState(frameId), () => value);
      },
    [getActiveFrameId]
  );
}

export function useGetDirectoryFrameEl(): () => Promise<HTMLElement | null> {
  return useGetDirectoryRecoilValue(frameElState);
}

export function useGetActiveDirectoryFrameId(): () => Promise<string> {
  return useGetRecoilValue(activeDirectoryFrameIdState);
}

export function useGetDirectoryPath(): (frameId?: string) => Promise<string> {
  return useGetDirectoryRecoilValue(directoryPathState);
}

export function useGetParentDirectoryPath(): (
  frameId?: string
) => Promise<string> {
  return useGetDirectoryRecoilValue(parentDirectoryPathState);
}

export function useGetTargetDirectoryFrameId(): (
  frameId?: string
) => Promise<string> {
  return useGetDirectoryRecoilValue(targetDirectoryFrameIdState);
}

export function useGetTargetDirectoryPath(): (
  frameId?: string
) => Promise<string> {
  const getTargetFrameId = useGetTargetDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  return useCallback(
    async (frameId) => {
      const targetFrameId = await getTargetFrameId(frameId);
      return await getDirectoryPath(targetFrameId);
    },
    [getDirectoryPath, getTargetFrameId]
  );
}

export function useGetEntryFilter(): (frameId?: string) => Promise<string> {
  return useGetDirectoryRecoilValue(entryFilterState);
}

export function useSetEntryFilter(): (
  value: string,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useRecoilCallback(
    ({ set }) =>
      async (value, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        set(entryFilterState(frameId), value);
      },
    [getActiveFrameId]
  );
}

export function useGetDefaultEntryFilter(): (
  frameId?: string
) => Promise<string> {
  return useGetDirectoryRecoilValue(defaultEntryFilterState);
}

export function useSetDefaultEntryFilter(): (
  value: string,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useRecoilCallback(
    ({ set }) =>
      async (value, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        set(defaultEntryFilterState(frameId), value);
      },
    [getActiveFrameId]
  );
}

export function useGetDirectoryFrameTypeList(): (
  frameId?: string
) => Promise<Set<string>> {
  return useGetDirectoryRecoilValue(frameTypeListState);
}

export function useSetDirectoryFrameType(): (
  frameType: string,
  addOrDelete: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useRecoilCallback(
    ({ set }) =>
      async (frameType, addOrDelete, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        set(
          frameTypeListState(frameId),
          createFrameTypeListSetter(frameType, addOrDelete)
        );
      },
    [getActiveFrameId]
  );
}

export function useHasDirectoryFrameTypeOf(): (
  frameType: string,
  frameId?: string
) => Promise<boolean> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getFrameTypeList = useGetDirectoryFrameTypeList();
  return useCallback(
    async (frameType, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const frameTypeList = await getFrameTypeList(frameId);
      return frameTypeList.has(frameType);
    },
    [getActiveFrameId, getFrameTypeList]
  );
}

export function useGetOriginalEntriesRef(): (
  frameId?: string
) => Promise<FakeRef<IEntry[]>> {
  return useGetDirectoryRecoilValue(originalEntriesRefState);
}

export function useGetSortedEntriesRef(): (
  frameId?: string
) => Promise<FakeRef<IEntry[]>> {
  return useGetDirectoryRecoilValue(sortedEntriesRefState);
}

export function useGetHistory(): (frameId?: string) => Promise<History> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const history = getHistory(frameId);
      return history;
    },
    [getActiveFrameId]
  );
}

export function useGetActiveRow(): (frameId?: string) => Promise<ActiveRow> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const adjustScrollPosition = useAdjustScrollPosition();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = getActiveRow(frameId);
      activeRow.adjustScrollPosition = adjustScrollPosition;
      return activeRow;
    },
    [adjustScrollPosition, getActiveFrameId]
  );
}

export function useGetActiveEntry(): (
  frameId?: string
) => Promise<IEntry | undefined> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getSortedEntriesRef = useGetSortedEntriesRef();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = getActiveRow(frameId);
      const sortedEntriesRef = await getSortedEntriesRef(frameId);
      return sortedEntriesRef.current.find(
        (entry) => entry.path === activeRow.path
      );
    },
    [getActiveFrameId, getSortedEntriesRef]
  );
}

export function useGetSelectedEntries(): (
  frameId?: string
) => Promise<IEntry[]> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getSortedEntriesRef = useGetSortedEntriesRef();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const selectedRowPaths = getAllSelectedRows(frameId).map(
        (row) => row.dataset.path
      );
      const sortedEntriesRef = await getSortedEntriesRef(frameId);
      return sortedEntriesRef.current.filter((entry) =>
        selectedRowPaths.includes(entry.path)
      );
    },
    [getActiveFrameId, getSortedEntriesRef]
  );
}

type IDirectoryInfo = {
  cwd: string;
  sourcePaths: string[];
  destinationDirectoryPath: string;
};

export function useGetDirectoryInfo(): (
  frameId?: string
) => Promise<IDirectoryInfo> {
  const selectedRowsOnly = useRecoilValue(selectedRowsOnlyState);
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  const getTargetDirectoryPath = useGetTargetDirectoryPath();
  const getActiveRow = useGetActiveRow();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const destinationDirectoryPath = await getTargetDirectoryPath(frameId);
      const cwd = await getDirectoryPath(frameId);
      const activeRow = await getActiveRow(frameId);
      const selectedRows = getAllSelectedRows(frameId);
      const sourcePaths =
        selectedRows.length > 0
          ? selectedRows.map((row) => row.dataset.path)
          : !selectedRowsOnly && activeRow.el?.dataset.parent === 'false'
          ? [activeRow.path]
          : [];
      return { cwd, sourcePaths, destinationDirectoryPath };
    },
    [
      getActiveFrameId,
      getActiveRow,
      getDirectoryPath,
      getTargetDirectoryPath,
      selectedRowsOnly,
    ]
  );
}

export function useCopy(): (
  overwrite: boolean,
  frameId?: string
) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  return useCallback(
    async (overwrite, frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length > 0) {
        copy({ ...directoryInfo, overwrite });
      }
    },
    [getDirectoryInfo]
  );
}

export function useMove(): (
  overwrite: boolean,
  frameId?: string
) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  return useCallback(
    async (overwrite, frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length > 0) {
        move({ ...directoryInfo, overwrite });
      }
    },
    [getDirectoryInfo]
  );
}

export function useZip(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const fileName = await prompt({
        attributes: { command: 'zip' },
        defaultValue: 'untitled.zip',
      });
      if (fileName) {
        zip({ ...directoryInfo, fileName });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useTar(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const fileName = await prompt({
        attributes: { command: 'tar' },
        defaultValue: 'untitled.tar.gz',
      });
      if (fileName) {
        const gz = /(\.tar\.gz|\.tgz)$/.test(fileName);
        tar({ ...directoryInfo, fileName, gz });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useUnzip(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const directoryName = await prompt({
        attributes: { command: 'unzip' },
        defaultValue: 'untitled directory',
      });
      if (directoryName) {
        unzip({
          sourcePath: directoryInfo.sourcePaths[0],
          destinationDirectoryPath: directoryInfo.destinationDirectoryPath,
          directoryName,
        });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useUntar(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const directoryName = await prompt({
        attributes: { command: 'untar' },
        defaultValue: 'untitled directory',
      });
      if (directoryName) {
        untar({
          sourcePath: directoryInfo.sourcePaths[0],
          destinationDirectoryPath: directoryInfo.destinationDirectoryPath,
          directoryName,
        });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useRemove(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length > 0) {
        remove({ sourcePaths: directoryInfo.sourcePaths });
      }
    },
    [getDirectoryInfo]
  );
}

export function useMakeDirectory(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      const directoryName = await prompt({
        attributes: { command: 'mkdir' },
        defaultValue: 'untitled directory',
      });
      if (directoryName) {
        makeDirectory({
          destinationDirectoryPath: directoryInfo.cwd,
          directoryName,
        });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useMakeVirtualDirectory(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const changeDirectory = useChangeDirectory();
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const process = makeVirtualDirectory({
        sourcePath: directoryInfo.sourcePaths[0],
      });
      process.on('finish', ({ actualPath, virtualPath }) => {
        VirtualDirectories.register(actualPath, virtualPath);
        changeDirectory(actualPath);
      });
    },
    [changeDirectory, getDirectoryInfo]
  );
}

export function useTouch(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      const fileName = await prompt({
        attributes: { command: 'touch' },
        defaultValue: 'untitled.txt',
      });
      if (fileName) {
        touch({
          destinationDirectoryPath: directoryInfo.cwd,
          fileName,
        });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useRename(): (frameId?: string) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const md = directoryInfo.sourcePaths[0].match(/[^/\\]+$/);
      const basename = await prompt({
        attributes: { command: 'rename' },
        defaultValue: md ? md[0] : '',
      });
      if (basename) {
        rename({
          sourcePath: directoryInfo.sourcePaths[0],
          basename,
        });
      }
    },
    [getDirectoryInfo, prompt]
  );
}

export function useOpenPath(): (
  app?: IOpenPathApp,
  frameId?: string
) => Promise<void> {
  const getDirectoryInfo = useGetDirectoryInfo();
  const getOpenPathApps = useGetRecoilValue(openPathAppsState);
  return useCallback(
    async (app, frameId) => {
      const directoryInfo = await getDirectoryInfo(frameId);
      if (directoryInfo.sourcePaths.length === 0) {
        return;
      }
      const sourcePath = directoryInfo.sourcePaths[0];
      if (app) {
        openPath({ sourcePath, app });
        return;
      }
      const apps = await getOpenPathApps();
      for (const pattern in apps) {
        const re = new RegExp(pattern, 'i');
        if (re.test(sourcePath)) {
          openPath({ sourcePath, app: apps[pattern] });
          return;
        }
      }
      openPath({ sourcePath });
    },
    [getDirectoryInfo, getOpenPathApps]
  );
}

export function useCursorMove(): (
  step: number,
  loop?: boolean,
  overflow?: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getSortedEntriesRef = useGetSortedEntriesRef();
  const getActiveRow = useGetActiveRow();
  return useCallback(
    async (step, loop = false, overflow = true, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const sortedEntriesRef = await getSortedEntriesRef(frameId);
      const activeRow = await getActiveRow(frameId);
      const maxIndex = sortedEntriesRef.current.length - 1;
      let nextIndex = activeRow.index + step;
      if (loop) {
        nextIndex = cycleIndex(
          activeRow.index,
          sortedEntriesRef.current.length,
          step
        );
      } else if (overflow) {
        nextIndex =
          nextIndex > maxIndex ? maxIndex : nextIndex < 0 ? 0 : nextIndex;
      } else {
        nextIndex =
          nextIndex > maxIndex || nextIndex < 0 ? activeRow.index : nextIndex;
      }
      activeRow.activate(nextIndex);
    },
    [getActiveFrameId, getActiveRow, getSortedEntriesRef]
  );
}

export function useScrollPage(): (
  direction: Parameters<typeof scrollPage>[0],
  frameId?: string
) => void {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getActiveRow = useGetActiveRow();
  const getFrameEl = useGetDirectoryRecoilValue(frameElState);
  return useCallback(
    async (direction, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = await getActiveRow(frameId);
      const frameEl = await getFrameEl(frameId);
      if (!activeRow.el || !frameEl) {
        return;
      }
      const edgeRowEl = scrollPage(direction, frameEl, activeRow.el);
      if (edgeRowEl) {
        activeRow.activate(edgeRowEl.dataset.path);
      }
    },
    [getActiveFrameId, getActiveRow, getFrameEl]
  );
}

export function useToggleActiveRowSelection(): (
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getActiveRow = useGetActiveRow();
  const cursorMove = useCursorMove();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = await getActiveRow(frameId);
      const selected = toggleRowSelectionBy(frameId, activeRow.index);
      if (selected) {
        await cursorMove(1, false, true, frameId);
      }
    },
    [cursorMove, getActiveFrameId, getActiveRow]
  );
}

export function useSetRowSelections(): (
  indexesOrPaths: (number | string)[],
  state: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useCallback(
    async (indexesOrPaths, state, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      indexesOrPaths.forEach((indexOrPath) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        toggleRowSelectionBy(frameId!, indexOrPath, state)
      );
    },
    [getActiveFrameId]
  );
}

export function useSetAllRowSelections(): (
  state: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useCallback(
    async (state, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      setAllRowSelections(frameId, state);
    },
    [getActiveFrameId]
  );
}

export function useInvertAllRowSelections(): (
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      invertAllRowSelections(frameId);
    },
    [getActiveFrameId]
  );
}

export function useSelectEntryByFirstLetter(): (
  letter: string,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getSortedEntries = useGetDirectoryRecoilValue(sortedEntriesState);
  const getActiveRow = useGetActiveRow();
  return useCallback(
    async (letter, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = await getActiveRow(frameId);
      const sortedEntries = await getSortedEntries(frameId);
      const indexes = sortedEntries.reduce((list: number[], entry, i) => {
        const character = entry.name.charAt(0).toLowerCase();
        if (!entry.parent && character === letter.toLowerCase()) {
          list.push(i);
        }
        return list;
      }, []);
      const index =
        indexes.find((index) => activeRow.index < index) ?? indexes[0] ?? -1;
      if (index !== -1) {
        activeRow.activate(index);
      }
    },
    [getActiveFrameId, getActiveRow, getSortedEntries]
  );
}

export function useGetRowSorts(): (frameId?: string) => Promise<ISort[]> {
  return useGetDirectoryRecoilValue(entrySortsState);
}

export function useSortRows(): (
  key: ISortKey,
  order: ISortOrder,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getRowSorts = useGetRowSorts();
  return useRecoilCallback(
    ({ set }) =>
      async (key, order, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        const rowSorts = await getRowSorts(frameId);
        const sorts = setSort(key, order, rowSorts);
        set(entrySortsState(frameId), sorts);
      },
    [getActiveFrameId, getRowSorts]
  );
}

export function useToggleRowSort(): (
  key: ISortKey,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getEntrySorts = useGetRowSorts();
  return useRecoilCallback(
    ({ set }) =>
      async (key, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        const entrySorts = await getEntrySorts(frameId);
        const sorts = toggleSort(key, entrySorts);
        set(entrySortsState(frameId), sorts);
      },
    [getActiveFrameId, getEntrySorts]
  );
}

export function useChangeDirectory(): (
  directoryPath: string,
  pushHistory?: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  const getHistory = useGetHistory();
  return useRecoilCallback(
    ({ set }) =>
      async (directoryPath, pushHistory = true, frameId) => {
        frameId = frameId ?? (await getActiveFrameId());
        const history = await getHistory(frameId);
        const cwd = await getDirectoryPath();
        const process = realPath({ cwd, sourcePath: directoryPath });
        process.on('finish', ({ path }) => {
          if (pushHistory) {
            history.push(path);
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          set(nextDirectoryPathState(frameId!), path);
          Connection.watchDirectory(path);
        });
      },
    [getActiveFrameId, getDirectoryPath, getHistory]
  );
}

export function useChangeDirectoryWithPrompt(): (
  frameId?: string
) => Promise<void> {
  const changeDirectory = useChangeDirectory();
  const prompt = useDialog('prompt');
  return useCallback(
    async (frameId) => {
      const directoryPath = await prompt({
        attributes: { command: 'cd' },
        defaultValue: '',
      });
      if (directoryPath) {
        await changeDirectory(directoryPath, true, frameId);
      }
    },
    [changeDirectory, prompt]
  );
}

export function useChangeToParentDirectory(): (
  pushHistory?: boolean,
  frameId?: string
) => Promise<void> {
  const getParentDirectoryPath = useGetParentDirectoryPath();
  const changeDirectory = useChangeDirectory();
  return useCallback(
    async (pushHistory, frameId) => {
      const path = await getParentDirectoryPath(frameId);
      if (path) {
        await changeDirectory(path, pushHistory, frameId);
      }
    },
    [changeDirectory, getParentDirectoryPath]
  );
}

export function useMatchDirectoryPaths(): (
  changeSelf: boolean,
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getTargetFrameId = useGetTargetDirectoryFrameId();
  const getTargetDirectoryPath = useGetTargetDirectoryPath();
  const getDirectoryPath = useGetDirectoryPath();
  const changeDirectory = useChangeDirectory();
  return useCallback(
    async (changeSelf, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const targetFrameId = await getTargetFrameId(frameId);
      const targetDirectoryPath = await getTargetDirectoryPath(frameId);
      const directoryPath = await getDirectoryPath(frameId);
      if (changeSelf) {
        await changeDirectory(targetDirectoryPath, true, frameId);
      } else {
        await changeDirectory(directoryPath, true, targetFrameId);
      }
    },
    [
      getActiveFrameId,
      getTargetFrameId,
      getTargetDirectoryPath,
      getDirectoryPath,
      changeDirectory,
    ]
  );
}

export function useExchangeDirectoryPaths(): () => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getTargetFrameId = useGetTargetDirectoryFrameId();
  const getTargetDirectoryPath = useGetTargetDirectoryPath();
  const getDirectoryPath = useGetDirectoryPath();
  const changeDirectory = useChangeDirectory();
  return useCallback(async () => {
    const frameId = await getActiveFrameId();
    const targetFrameId = await getTargetFrameId(frameId);
    const targetDirectoryPath = await getTargetDirectoryPath(frameId);
    const directoryPath = await getDirectoryPath(frameId);
    await changeDirectory(targetDirectoryPath, true, frameId);
    await changeDirectory(directoryPath, true, targetFrameId);
  }, [
    changeDirectory,
    getActiveFrameId,
    getDirectoryPath,
    getTargetDirectoryPath,
    getTargetFrameId,
  ]);
}

export function useRefreshDirectory(): (frameId?: string) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  const changeDirectory = useChangeDirectory();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const directoryPath = await getDirectoryPath(frameId);
      await changeDirectory(directoryPath, false, frameId);
    },
    [changeDirectory, getActiveFrameId, getDirectoryPath]
  );
}

export function useProcessActiveRow(): (frameId?: string) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getActiveRow = useGetActiveRow();
  const changeDirectory = useChangeDirectory();
  const makeVirtualDirectory = useMakeVirtualDirectory();
  const openPath = useOpenPath();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const activeRow = await getActiveRow(frameId);
      if (!activeRow.el) {
        return;
      }
      const { path, type } = activeRow.el.dataset;
      switch (type) {
        case 'directory': {
          await changeDirectory(path, true, frameId);
          break;
        }
        case 'file': {
          if (/\.(zip|tar(\.gz)?|tgz)$/.test(path)) {
            await makeVirtualDirectory(frameId);
          } else {
            await openPath(undefined, frameId);
          }
          break;
        }
        case 'link':
        case 'unknown': {
          // await openPath({ name: 'Visual Studio Code' }, frameId);
          await openPath(undefined, frameId);
          break;
        }
      }
    },
    [
      changeDirectory,
      getActiveFrameId,
      getActiveRow,
      makeVirtualDirectory,
      openPath,
    ]
  );
}

export function useHistoryGo(): (
  useIndex: boolean,
  indexOrStep: number,
  frameId?: string
) => Promise<boolean> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getHistory = useGetHistory();
  const changeDirectory = useChangeDirectory();
  return useCallback(
    async (useIndex, indexOrStep, frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const history = await getHistory(frameId);
      const directoryPath = useIndex
        ? history.go(indexOrStep)
        : history.goBy(indexOrStep);
      if (directoryPath) {
        await changeDirectory(directoryPath, false, frameId);
        return true;
      }
      return false;
    },
    [changeDirectory, getActiveFrameId, getHistory]
  );
}

export function useHistoryGoTo(): (
  index: number,
  frameId?: string
) => Promise<boolean> {
  const historyGo = useHistoryGo();
  return useCallback(
    async (index, frameId) => {
      return historyGo(true, index, frameId);
    },
    [historyGo]
  );
}

export function useHistoryGoBy(): (
  step: number,
  frameId?: string
) => Promise<boolean> {
  const historyGo = useHistoryGo();
  return useCallback(
    async (step, frameId) => {
      return historyGo(false, step, frameId);
    },
    [historyGo]
  );
}

export function useShowHistoryDialog(): (frameId?: string) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getHistory = useGetHistory();
  const changeDirectory = useChangeDirectory();
  const itemSelector = useDialog('itemSelector');
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const history = await getHistory(frameId);
      const dataSet = VirtualDirectories.createDataSet(history.paths);
      if (dataSet.length === 0) {
        return;
      }
      const item = await itemSelector({
        dataSet,
        onDelete: (path) => history.delete(path),
      });
      if (item) {
        await changeDirectory(item, true, frameId);
      }
    },
    [changeDirectory, getActiveFrameId, getHistory, itemSelector]
  );
}

export function useBookmarkCurrentDirectory(): (
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  const writeLog = useWriteLog();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const directoryPath = await getDirectoryPath(frameId);
      const logBase = { data: '', attributes: { path: directoryPath } };
      if (VirtualDirectories.includes(directoryPath)) {
        writeLog({ ...logBase, level: 'error', className: 'bookmarkError' });
        return;
      }
      if (Bookmark.has(directoryPath)) {
        writeLog({ ...logBase, className: 'bookmarkExists' });
        return;
      }
      Bookmark.add(directoryPath);
      writeLog({ ...logBase, className: 'bookmarkAdd' });
    },
    [getActiveFrameId, getDirectoryPath, writeLog]
  );
}

export function useShowBookmarkDialog(): (frameId?: string) => Promise<void> {
  const changeDirectory = useChangeDirectory();
  const itemSelector = useDialog('itemSelector');
  return useCallback(
    async (frameId) => {
      if (Bookmark.dataSet.length === 0) {
        return;
      }
      const item = await itemSelector({
        dataSet: [...Bookmark.dataSet].reverse(),
        onDelete: (path) => Bookmark.delete(path),
      });
      if (item) {
        await changeDirectory(item, true, frameId);
      }
    },
    [changeDirectory, itemSelector]
  );
}

export function useCopyItemPaths(): (frameId?: string) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      copyItemPaths(frameId);
    },
    [getActiveFrameId]
  );
}

export function useCopyCurrentDirectoryPath(): (
  frameId?: string
) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      const directoryPath = await getDirectoryPath(frameId);
      copyText(directoryPath);
    },
    [getActiveFrameId, getDirectoryPath]
  );
}

export function useFocusDirectoryFrame(): (
  indexOrId?: number | string
) => Promise<void> {
  const getActiveDirectoryFrameId = useGetActiveDirectoryFrameId();
  const focusFrame = useFocusFrame();
  return useCallback(
    async (indexOrId) => {
      let frameId: string;
      switch (typeof indexOrId) {
        case 'number': {
          frameId = DIRECTORY_ID_LIST[indexOrId];
          break;
        }
        case 'string': {
          frameId = indexOrId;
          break;
        }
        default: {
          frameId = await getActiveDirectoryFrameId();
          break;
        }
      }
      await focusFrame(frameId);
    },
    [focusFrame, getActiveDirectoryFrameId]
  );
}

export function useCycleDirectoryFrameFocus(): (step: number) => Promise<void> {
  const getActiveDirectoryFrameId = useGetActiveDirectoryFrameId();
  const focusFrame = useFocusFrame();
  return useCallback(
    async (step) => {
      const activeFrameId = await getActiveDirectoryFrameId();
      const current = DIRECTORY_ID_LIST.indexOf(activeFrameId);
      const nextIndex = cycleIndex(current, DIRECTORY_ID_LIST.length, step);
      const nextFrameId = DIRECTORY_ID_LIST[nextIndex];
      await focusFrame(nextFrameId);
    },
    [focusFrame, getActiveDirectoryFrameId]
  );
}

export function useFocusFilterInput(): (frameId?: string) => Promise<void> {
  const getActiveFrameId = useGetActiveDirectoryFrameId();
  const focusFilterInput = useFocusFilterInputHook();
  return useCallback(
    async (frameId) => {
      frameId = frameId ?? (await getActiveFrameId());
      await focusFilterInput(frameId);
    },
    [focusFilterInput, getActiveFrameId]
  );
}

export function useHasDirectoryError(): (frameId?: string) => Promise<boolean> {
  const hasFrameTypeOf = useHasDirectoryFrameTypeOf();
  return useCallback(
    async (frameId) => {
      return await hasFrameTypeOf(ERROR_KEY, frameId);
    },
    [hasFrameTypeOf]
  );
}

export function useClearDirectoryError(): (frameId?: string) => Promise<void> {
  const setFrameType = useSetDirectoryFrameType();
  return useCallback(
    async (frameId) => {
      await setFrameType(ERROR_KEY, false, frameId);
    },
    [setFrameType]
  );
}

export function useIsVirtualDirectory(): (
  frameId?: string
) => Promise<boolean> {
  const getFrameTypeList = useGetDirectoryFrameTypeList();
  return useCallback(
    async (frameId) => {
      const frameTypeList = await getFrameTypeList(frameId);
      return frameTypeList.has(VIRTUAL_DIRECTORY_KEY);
    },
    [getFrameTypeList]
  );
}

export function useHandleThClick(
  frameId: string
): (e: MouseEvent<IThEl>) => void {
  const toggleRowSort = useToggleRowSort();
  return useCallback(
    (e) => {
      toggleRowSort(e.currentTarget.dataset.col, frameId);
    },
    [frameId, toggleRowSort]
  );
}

export function useHandleTrClick(
  frameId: string
): (e: MouseEvent<ITrEl>) => Promise<void> {
  const getActiveRow = useGetActiveRow();
  return useCallback(
    async (e) => {
      const activeRow = await getActiveRow(frameId);
      // 非同期の時は e.currentTarget は null になってしまう
      const trEl = (e.target as Element).closest('tr') as ITrEl;
      const { index, path } = trEl.dataset;
      if (e.metaKey) {
        toggleRowSelection(trEl);
        activeRow.activate(path);
        return;
      }
      if (!e.shiftKey) {
        setAllRowSelections(frameId, false);
        activeRow.activate(path);
        return;
      }
      const selectedRows = getAllSelectedRows(frameId);
      if (selectedRows.length === 0) {
        toggleRowRangeSelection(frameId, activeRow.index, +index, true);
        activeRow.activate(path);
        return;
      }
      const firstIndex = selectedRows[0].dataset.index;
      const lastIndex = selectedRows[selectedRows.length - 1].dataset.index;
      const startIndex = +firstIndex > +index ? +lastIndex : +firstIndex;
      toggleRowRangeSelection(frameId, startIndex, +index, true);
      activeRow.activate(path);
    },
    [frameId, getActiveRow]
  );
}

export function useHandleTrDoubleClick(frameId: string): () => void {
  const processActiveRow = useProcessActiveRow();
  return useCallback(() => {
    processActiveRow(frameId);
  }, [frameId, processActiveRow]);
}

export function useConfigureDirectory(): (
  frameId: string,
  frameIndex: number,
  settings: ISettings[typeof DIRECTORY_KEY]
) => Promise<void> {
  const getDirectoryPath = useGetDirectoryPath();
  const changeDirectory = useChangeDirectory();
  return useRecoilCallback(
    ({ set }) =>
      async (frameId, frameIndex, settings) => {
        const { filter, path, previewMaker, sorts } =
          settings.frames[frameIndex];
        set(selectedRowsOnlyState, settings.selectedRowsOnly);
        set(openPathAppsState, settings.openPathApps);
        set(previewMakerState(frameId), () => previewMaker);
        const savedPath = await getDirectoryPath(frameId);
        if (savedPath) {
          await changeDirectory(savedPath, true, frameId);
          return;
        }
        set(entrySortsState(frameId), sorts);
        set(entryFilterState(frameId), filter);
        await changeDirectory(path, true, frameId);
      },
    [changeDirectory, getDirectoryPath]
  );
}

export function useOnDirectoryUpdate(
  frameId: string
): OmitFirstParameter<IConnectionDirectoryUpdate> {
  const getNextDirectoryPath = useGetDirectoryRecoilValue(
    nextDirectoryPathState
  );
  const getOriginalEntriesRef = useGetDirectoryRecoilValue(
    originalEntriesRefState
  );
  const getDirectoryPath = useGetDirectoryPath();
  return useRecoilCallback(
    ({ set }) =>
      async (directoryPath, entries) => {
        const nextDirectoryPath = await getNextDirectoryPath(frameId);
        if (directoryPath !== nextDirectoryPath) {
          return;
        }
        const originalEntriesRef = await getOriginalEntriesRef(frameId);
        const currentDirectoryPath = await getDirectoryPath(frameId);
        set(originalEntriesState(frameId), entries);
        originalEntriesRef.current = entries;
        set(directoryPathState(frameId), directoryPath);
        set(directoryStatusState(frameId), '');
        set(
          frameTypeListState(frameId),
          createFrameTypeListSetter(ERROR_KEY, false)
        );
        Connection.setWatchInfo(frameId, directoryPath);
        if (currentDirectoryPath !== directoryPath) {
          Connection.unwatchDirectory(frameId, currentDirectoryPath);
        }
      },
    [frameId, getDirectoryPath, getNextDirectoryPath, getOriginalEntriesRef]
  );
}

export function useOnDirectoryError(
  frameId: string
): OmitFirstParameter<IConnectionDirectoryError> {
  const getNextDirectoryPath = useGetDirectoryRecoilValue(
    nextDirectoryPathState
  );
  const getDirectoryPath = useGetDirectoryPath();
  return useRecoilCallback(
    ({ set }) =>
      async (directoryPath, message) => {
        const nextDirectoryPath = await getNextDirectoryPath(frameId);
        const currentDirectoryPath = await getDirectoryPath(frameId);
        if (directoryPath === nextDirectoryPath) {
          set(directoryStatusState(frameId), message);
          set(
            frameTypeListState(frameId),
            createFrameTypeListSetter(ERROR_KEY, true)
          );
          set(nextDirectoryPathState(frameId), '');
        }
        if (directoryPath === currentDirectoryPath) {
          Connection.unwatchDirectory(frameId, currentDirectoryPath);
        }
      },
    [frameId, getDirectoryPath, getNextDirectoryPath]
  );
}

export function usePreviousDirectorySelectionEffect(frameId: string): void {
  const getHistory = useGetHistory();
  const getActiveRow = useGetActiveRow();
  const directoryPath = useRecoilValue(directoryPathState(frameId));
  const sortedEntriesRef = useRecoilValue(sortedEntriesRefState(frameId));
  useEffect(() => {
    async function selectPreviousDirectory() {
      const history = await getHistory(frameId);
      const activeRow = await getActiveRow(frameId);
      const entry = sortedEntriesRef.current.find(
        (entry) => entry.path === history.previous
      );
      activeRow.activate(entry?.path ?? 0);
    }
    selectPreviousDirectory();
  }, [directoryPath, frameId, getActiveRow, getHistory, sortedEntriesRef]); // directoryPath is intentional
}

export function useActiveRowFixEffect(frameId: string): void {
  const getActiveRow = useGetActiveRow();
  const sortedEntries = useRecoilValue(sortedEntriesState(frameId));
  const entryFilter = useRecoilValue(entryFilterState(frameId));
  useEffect(() => {
    async function fixActiveRow() {
      const activeRow = await getActiveRow(frameId);
      const successful = activeRow.reactivate();
      if (successful) {
        return;
      }
      if (entryFilter) {
        activeRow.activate(1) || activeRow.activate(0);
      } else {
        activeRow.activate(0);
      }
    }
    fixActiveRow();
  }, [entryFilter, frameId, getActiveRow, sortedEntries]); // sortedEntries is intentional
}

export function useVirtualDirectoryDetectionEffect(frameId: string): void {
  const setFrameTypeList = useSetRecoilState(frameTypeListState(frameId));
  const directoryPath = useRecoilValue(directoryPathState(frameId));
  useEffect(() => {
    const addOrDelete = VirtualDirectories.includes(directoryPath);
    setFrameTypeList(
      createFrameTypeListSetter(VIRTUAL_DIRECTORY_KEY, addOrDelete)
    );
  }, [directoryPath, setFrameTypeList]);
}

export function useSaveDataEffect(frameId: string): void {
  const getHistory = useGetHistory();
  const persistent = useRecoilValue(persistentSettingsState);
  useEffect(() => {
    if (!persistent) {
      return;
    }
    async function saveData() {
      const history = await getHistory(frameId);
      history.save();
      Bookmark.save();
      VirtualDirectories.save();
    }
    saveData();
  }, [frameId, getHistory, persistent]);
}

export function useInitializationEffect(frameId: string): void {
  const setFocusListener = useSetRecoilState(focusListenerState(frameId));
  const setActiveFrameId = useSetRecoilState(activeDirectoryFrameIdState);
  const onDirectoryUpdate = useOnDirectoryUpdate(frameId);
  const onDirectoryError = useOnDirectoryError(frameId);
  useEffect(() => {
    setFocusListener(() => () => setActiveFrameId(frameId));
    Connection.on<IConnectionDirectoryUpdate>(
      'directoryUpdate',
      onDirectoryUpdate
    );
    Connection.on<IConnectionDirectoryError>(
      'directoryError',
      onDirectoryError
    );
  }, [
    frameId,
    onDirectoryError,
    onDirectoryUpdate,
    setActiveFrameId,
    setFocusListener,
  ]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useDirectoryExports() {
  const setPreviewMaker = useSetPreviewMaker();
  const getFrameEl = useGetDirectoryFrameEl();
  const getActiveDirectoryFrameId = useGetActiveDirectoryFrameId();
  const getDirectoryPath = useGetDirectoryPath();
  const getParentDirectoryPath = useGetParentDirectoryPath();
  const getTargetDirectoryFrameId = useGetTargetDirectoryFrameId();
  const getTargetDirectoryPath = useGetTargetDirectoryPath();
  const getEntryFilter = useGetEntryFilter();
  const setEntryFilter = useSetEntryFilter();
  const getDefaultEntryFilter = useGetDefaultEntryFilter();
  const setDefaultEntryFilter = useSetDefaultEntryFilter();
  const getFrameTypeList = useGetDirectoryFrameTypeList();
  const setFrameType = useSetDirectoryFrameType();
  const hasFrameTypeOf = useHasDirectoryFrameTypeOf();
  const getOriginalEntriesRef = useGetOriginalEntriesRef();
  const getSortedEntriesRef = useGetSortedEntriesRef();
  const getHistory = useGetHistory();
  const getActiveRow = useGetActiveRow();
  const getActiveEntry = useGetActiveEntry();
  const getSelectedEntries = useGetSelectedEntries();
  const getDirectoryInfo = useGetDirectoryInfo();
  const copy = useCopy();
  const move = useMove();
  const zip = useZip();
  const tar = useTar();
  const unzip = useUnzip();
  const untar = useUntar();
  const remove = useRemove();
  const makeDirectory = useMakeDirectory();
  const makeVirtualDirectory = useMakeVirtualDirectory();
  const touch = useTouch();
  const rename = useRename();
  const openPath = useOpenPath();
  const cursorMove = useCursorMove();
  const scrollPage = useScrollPage();
  const toggleActiveRowSelection = useToggleActiveRowSelection();
  const setRowSelections = useSetRowSelections();
  const setAllRowSelections = useSetAllRowSelections();
  const invertAllRowSelections = useInvertAllRowSelections();
  const selectEntryByFirstLetter = useSelectEntryByFirstLetter();
  const getRowSorts = useGetRowSorts();
  const sortRows = useSortRows();
  const toggleRowSort = useToggleRowSort();
  const changeDirectory = useChangeDirectory();
  const changeDirectoryWithPrompt = useChangeDirectoryWithPrompt();
  const changeToParentDirectory = useChangeToParentDirectory();
  const matchDirectoryPaths = useMatchDirectoryPaths();
  const exchangeDirectoryPaths = useExchangeDirectoryPaths();
  const refresh = useRefreshDirectory();
  const processActiveRow = useProcessActiveRow();
  const historyGoTo = useHistoryGoTo();
  const historyGoBy = useHistoryGoBy();
  const showHistoryDialog = useShowHistoryDialog();
  const bookmarkCurrentDirectory = useBookmarkCurrentDirectory();
  const showBookmarkDialog = useShowBookmarkDialog();
  const copyItemPaths = useCopyItemPaths();
  const copyCurrentDirectoryPath = useCopyCurrentDirectoryPath();
  const focusFrame = useFocusDirectoryFrame();
  const cycleFrameFocus = useCycleDirectoryFrameFocus();
  const focusFilterInput = useFocusFilterInput();
  const hasDirectoryError = useHasDirectoryError();
  const clearDirectoryError = useClearDirectoryError();
  const isVirtualDirectory = useIsVirtualDirectory();
  return useMemo(
    () => ({
      setPreviewMaker,
      getFrameEl,
      getActiveDirectoryFrameId,
      getDirectoryPath,
      getParentDirectoryPath,
      getTargetDirectoryFrameId,
      getTargetDirectoryPath,
      getEntryFilter,
      setEntryFilter,
      getDefaultEntryFilter,
      setDefaultEntryFilter,
      getFrameTypeList,
      setFrameType,
      hasFrameTypeOf,
      getOriginalEntriesRef,
      getSortedEntriesRef,
      getHistory,
      getActiveRow,
      getActiveEntry,
      getSelectedEntries,
      getDirectoryInfo,
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
      cursorMove,
      scrollPage,
      toggleActiveRowSelection,
      setRowSelections,
      setAllRowSelections,
      invertAllRowSelections,
      selectEntryByFirstLetter,
      getRowSorts,
      sortRows,
      toggleRowSort,
      changeDirectory,
      changeDirectoryWithPrompt,
      changeToParentDirectory,
      matchDirectoryPaths,
      exchangeDirectoryPaths,
      refresh,
      processActiveRow,
      historyGoTo,
      historyGoBy,
      showHistoryDialog,
      bookmarkCurrentDirectory,
      showBookmarkDialog,
      copyItemPaths,
      copyCurrentDirectoryPath,
      focusFrame,
      cycleFrameFocus,
      focusFilterInput,
      hasDirectoryError,
      clearDirectoryError,
      isVirtualDirectory,
      rawApi,
    }),
    [
      bookmarkCurrentDirectory,
      changeDirectory,
      changeDirectoryWithPrompt,
      changeToParentDirectory,
      clearDirectoryError,
      copy,
      copyCurrentDirectoryPath,
      copyItemPaths,
      cursorMove,
      cycleFrameFocus,
      exchangeDirectoryPaths,
      focusFilterInput,
      focusFrame,
      getActiveDirectoryFrameId,
      getActiveEntry,
      getActiveRow,
      getDefaultEntryFilter,
      getDirectoryInfo,
      getDirectoryPath,
      getEntryFilter,
      getFrameEl,
      getFrameTypeList,
      getHistory,
      getOriginalEntriesRef,
      getParentDirectoryPath,
      getRowSorts,
      getSelectedEntries,
      getSortedEntriesRef,
      getTargetDirectoryFrameId,
      getTargetDirectoryPath,
      hasDirectoryError,
      hasFrameTypeOf,
      historyGoBy,
      historyGoTo,
      invertAllRowSelections,
      isVirtualDirectory,
      makeDirectory,
      makeVirtualDirectory,
      matchDirectoryPaths,
      move,
      openPath,
      processActiveRow,
      refresh,
      remove,
      rename,
      scrollPage,
      selectEntryByFirstLetter,
      setAllRowSelections,
      setDefaultEntryFilter,
      setEntryFilter,
      setFrameType,
      setPreviewMaker,
      setRowSelections,
      showBookmarkDialog,
      showHistoryDialog,
      sortRows,
      tar,
      toggleActiveRowSelection,
      toggleRowSort,
      touch,
      untar,
      unzip,
      zip,
    ]
  );
}
