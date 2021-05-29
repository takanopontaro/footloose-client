import { RefObject, useCallback, useEffect, useMemo } from 'react';
import {
  RecoilState,
  RecoilValueReadOnly,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { APP_KEY, cycleIndex, toggleHtmlClassName, wait } from './app-lib';
import {
  allExportsState,
  bootstrapState,
  exportsState,
  focusedFrameIdState,
  keyBindingsState,
  persistentSettingsState,
} from './app-recoil';
import { IExports, IKeyMaps, ISettings } from './app-typings';
import { useDialog, useGetCurrentDialogType } from './dialog-hooks';
import { DIALOG_KEY } from './dialog-lib';
import {
  useConfigureDirectory,
  useFocusDirectoryFrame,
  useGetActiveDirectoryFrameId,
} from './directory-hooks';
import { DIRECTORY_ID_LIST, DIRECTORY_KEY } from './directory-lib';
import { FILTER_INPUT_KEY } from './filter-input-lib';
import { useFocusFrame } from './frame-hooks';
import { ITEM_SELECTOR_KEY } from './item-selector-lib';
import { useConfigureLog } from './log-hooks';
import { LOG_KEY } from './log-lib';
import { getShortcut } from './shortcut';
import { useConfigureTaskManager } from './task-manager-hooks';
import { TASK_MANAGER_KEY } from './task-manager-lib';

export function useGetRecoilValue<T>(
  recoilState: RecoilState<T> | RecoilValueReadOnly<T>
): () => Promise<T> {
  return useRecoilCallback(
    ({ snapshot }) =>
      async () =>
        await snapshot.getPromise(recoilState),
    [recoilState]
  );
}

export function useGetRecoilValueFamily<T>(
  recoilState: (param: string) => RecoilState<T> | RecoilValueReadOnly<T>
): (param: string) => Promise<T> {
  return useRecoilCallback(
    ({ snapshot }) =>
      async (param) =>
        await snapshot.getPromise(recoilState(param)),
    [recoilState]
  );
}

export function useGetFocusedFrameId(): () => Promise<string> {
  return useGetRecoilValue(focusedFrameIdState);
}

export function useCycleFrameFocus(): (step: number) => Promise<void> {
  const getFocusedFrameId = useGetFocusedFrameId();
  const getActiveDirectoryFrameId = useGetActiveDirectoryFrameId();
  const focusFrame = useFocusFrame();
  return useCallback(
    async (step) => {
      const focusedFrameId = await getFocusedFrameId();
      const activeDirectoryFrameId = await getActiveDirectoryFrameId();
      const idList = [activeDirectoryFrameId, LOG_KEY, TASK_MANAGER_KEY];
      const index = idList.findIndex((id) => id === focusedFrameId);
      const nextIndex = cycleIndex(index, idList.length, step);
      await focusFrame(idList[nextIndex]);
    },
    [focusFrame, getActiveDirectoryFrameId, getFocusedFrameId]
  );
}

export function useConfigure(): (settings: ISettings) => void {
  const setPersistentSettings = useSetRecoilState(persistentSettingsState);
  const configureDirectory = useConfigureDirectory();
  const configureLog = useConfigureLog();
  const configureTaskManager = useConfigureTaskManager();
  return useCallback(
    (settings) => {
      const {
        [APP_KEY]: app,
        [DIRECTORY_KEY]: directory,
        [LOG_KEY]: log,
        [TASK_MANAGER_KEY]: taskManager,
      } = settings;
      setPersistentSettings(app.persistentSettings);
      DIRECTORY_ID_LIST.forEach((frameId, i) =>
        configureDirectory(frameId, i, directory)
      );
      configureLog(log);
      configureTaskManager(taskManager);
    },
    [
      configureDirectory,
      configureLog,
      configureTaskManager,
      setPersistentSettings,
    ]
  );
}

export function useBindKeys(): (keyMaps: IKeyMaps) => void {
  const setAppKeyBindings = useSetRecoilState(keyBindingsState(APP_KEY));
  const setDialogKeyBindings = useSetRecoilState(keyBindingsState(DIALOG_KEY));
  const setItemSelectorKeyBindings = useSetRecoilState(
    keyBindingsState(ITEM_SELECTOR_KEY)
  );
  const setDirectoryKeyBindings = useSetRecoilState(
    keyBindingsState(DIRECTORY_KEY)
  );
  const setFilterInputKeyBindings = useSetRecoilState(
    keyBindingsState(FILTER_INPUT_KEY)
  );
  const setLogKeyBindings = useSetRecoilState(keyBindingsState(LOG_KEY));
  const setTaskManagerKeyBindings = useSetRecoilState(
    keyBindingsState(TASK_MANAGER_KEY)
  );
  return useCallback(
    (keyMaps) => {
      setAppKeyBindings(keyMaps.app);
      setDialogKeyBindings(keyMaps.dialog);
      setItemSelectorKeyBindings(keyMaps.itemSelector);
      setDirectoryKeyBindings(keyMaps.directory);
      setFilterInputKeyBindings(keyMaps.filterInput);
      setLogKeyBindings(keyMaps.log);
      setTaskManagerKeyBindings(keyMaps.taskManager);
    },
    [
      setAppKeyBindings,
      setDialogKeyBindings,
      setDirectoryKeyBindings,
      setFilterInputKeyBindings,
      setItemSelectorKeyBindings,
      setLogKeyBindings,
      setTaskManagerKeyBindings,
    ]
  );
}

export function useReloadKeyMaps(): () => Promise<void> {
  const bindKeys = useBindKeys();
  const { getKeyMaps } = useRecoilValue(bootstrapState);
  const getAllExports = useGetRecoilValue(allExportsState);
  return useCallback(async () => {
    const allExports = await getAllExports();
    const keyMaps = await getKeyMaps(allExports);
    bindKeys(keyMaps);
  }, [bindKeys, getAllExports, getKeyMaps]);
}

export function useKeyboardShortcutsEffect(
  key: string,
  id: string,
  elRef?: RefObject<Element | null>
): void {
  const keyBindings = useRecoilValue(keyBindingsState(key));
  useEffect(() => {
    if (elRef?.current === null) {
      return;
    }
    const shortcut = getShortcut(id, elRef?.current);
    shortcut.bind(keyBindings);
  }, [elRef, id, keyBindings]);
}

export function useExportsEffect(id: string, exports: IExports): void {
  const setExports = useSetRecoilState(exportsState(id));
  useEffect(() => {
    setExports(exports);
  }, [exports, setExports]);
}

export function useKeyMapsUpdateEffect(): void {
  const reloadKeyMaps = useReloadKeyMaps();
  const allExports = useRecoilValue(allExportsState);
  useEffect(() => {
    if ('reloadKeyMaps' in allExports.app) {
      reloadKeyMaps();
    }
  }, [allExports, reloadKeyMaps]); // allExports is intentional
}

export function useInitializationEffect(): void {
  const configure = useConfigure();
  const { getSettings } = useRecoilValue(bootstrapState);
  const focusDirectoryFrame = useFocusDirectoryFrame();
  useEffect(() => {
    async function initialize() {
      await wait(100);
      const settings = await getSettings();
      configure(settings);
      await focusDirectoryFrame(0);
    }
    initialize();
  }, [configure, focusDirectoryFrame, getSettings]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useAppExports() {
  const reloadKeyMaps = useReloadKeyMaps();
  const getFocusedFrameId = useGetFocusedFrameId();
  const cycleFrameFocus = useCycleFrameFocus();
  const toggleClassName = toggleHtmlClassName;
  const getCurrentDialogType = useGetCurrentDialogType();
  const alert = useDialog('alert');
  const confirm = useDialog('confirm');
  const prompt = useDialog('prompt');
  return useMemo(
    () => ({
      reloadKeyMaps,
      getFocusedFrameId,
      cycleFrameFocus,
      toggleClassName,
      getCurrentDialogType,
      alert,
      confirm,
      prompt,
    }),
    [
      alert,
      confirm,
      cycleFrameFocus,
      getCurrentDialogType,
      getFocusedFrameId,
      prompt,
      reloadKeyMaps,
      toggleClassName,
    ]
  );
}
