import { useCallback, useEffect, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { addClassNamePrefix } from './app-lib';
import {
  useAdjustScrollPosition,
  useFocusFrame,
  useGetFrameEl,
  useGetFrameTypeList,
  useSetFrameType,
} from './frame-hooks';
import { LOG_KEY, getLastLogEl } from './log-lib';
import { lastLogState, logDataState, logFilterState } from './log-recoil';
import { ILogData, ILogSettings } from './log-typings';
import { Process } from './process';

export function useWriteLog(): (parameters: ILogData) => void {
  const setLastLog = useSetRecoilState(lastLogState);
  return useCallback(
    (parameters) => {
      setLastLog({
        ...parameters,
        className: addClassNamePrefix(parameters.className, 'log'),
      });
    },
    [setLastLog]
  );
}

export function useGetLogFrameEl(): () => Promise<HTMLElement | null> {
  const getFrameEl = useGetFrameEl();
  return useCallback(async () => {
    return await getFrameEl(LOG_KEY);
  }, [getFrameEl]);
}

export function useGetLogFrameTypeList(): () => Promise<Set<string>> {
  const getFrameTypeList = useGetFrameTypeList();
  return useCallback(async () => {
    return await getFrameTypeList(LOG_KEY);
  }, [getFrameTypeList]);
}

export function useSetLogFrameType(): (
  frameType: string,
  addOrDelete: boolean
) => Promise<void> {
  const setFrameType = useSetFrameType();
  return useCallback(
    async (frameType, addOrDelete) => {
      await setFrameType(LOG_KEY, frameType, addOrDelete);
    },
    [setFrameType]
  );
}

export function useHasLogFrameTypeOf(): (
  frameType: string
) => Promise<boolean> {
  const getFrameTypeList = useGetLogFrameTypeList();
  return useCallback(
    async (frameType) => {
      const frameTypeList = await getFrameTypeList();
      return frameTypeList.has(frameType);
    },
    [getFrameTypeList]
  );
}

export function useFocusLogFrame(): () => void {
  const focusFrame = useFocusFrame();
  return useCallback(() => {
    focusFrame(LOG_KEY);
  }, [focusFrame]);
}

export function useConfigureLog(): (settings: ILogSettings) => void {
  const setLogFilter = useSetRecoilState(logFilterState);
  return useCallback(
    (settings) => {
      setLogFilter(() => settings.filter);
    },
    [setLogFilter]
  );
}

export function useLogUpdateEffect(): void {
  const adjustScrollPosition = useAdjustScrollPosition();
  const logData = useRecoilValue(logDataState);
  useEffect(() => {
    const el = getLastLogEl();
    if (el) {
      adjustScrollPosition(LOG_KEY, el);
    }
  }, [adjustScrollPosition, logData]); // logData is intentional
}

export function useInitializationEffect(): void {
  const writeLog = useWriteLog();
  useEffect(() => {
    Process.writeLog = writeLog;
  }, [writeLog]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useLogExports() {
  const getFrameEl = useGetLogFrameEl();
  const getFrameTypeList = useGetLogFrameTypeList();
  const setFrameType = useSetLogFrameType();
  const hasFrameTypeOf = useHasLogFrameTypeOf();
  const focusFrame = useFocusLogFrame();
  const write = useWriteLog();
  return useMemo(
    () => ({
      getFrameEl,
      getFrameTypeList,
      setFrameType,
      hasFrameTypeOf,
      focusFrame,
      write,
    }),
    [
      focusFrame,
      getFrameEl,
      getFrameTypeList,
      hasFrameTypeOf,
      setFrameType,
      write,
    ]
  );
}
