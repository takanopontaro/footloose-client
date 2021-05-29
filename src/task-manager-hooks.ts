import cloneDeep from 'clone-deep';
import { ICommandReturn } from 'footloose';
import { MouseEvent, useCallback, useEffect, useMemo } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { useGetRecoilValue } from './app-hooks';
import { focusLastElement, moveElementFocus } from './app-lib';
import {
  useAdjustScrollPosition,
  useFocusFrame,
  useGetFrameEl,
  useGetFrameTypeList,
  useSetFrameType,
} from './frame-hooks';
import { focusListenerState, frameElState } from './frame-recoil';
import { useWriteLog } from './log-hooks';
import { Process } from './process';
import {
  TASK_MANAGER_KEY,
  buildTaskData,
  getLastTaskEl,
} from './task-manager-lib';
import {
  lastTaskState,
  taskFilterState,
  taskListState,
} from './task-manager-recoil';
import { IButtonEl, ITask, ITaskManagerSettings } from './task-manager-typings';

export function useGetTaskList(): () => Promise<ITask[]> {
  return useGetRecoilValue(taskListState);
}

export function useAbortTask(): (processId: string) => Promise<void> {
  const getTaskList = useGetTaskList();
  return useCallback(
    async (processId) => {
      const taskList = await getTaskList();
      const task = taskList.find((task) => task.processId === processId);
      if (task) {
        Process.abort(task.processId);
      }
    },
    [getTaskList]
  );
}

export function useHandleClickAbort(): (e: MouseEvent<IButtonEl>) => void {
  const abortTask = useAbortTask();
  return useCallback(
    (e) => {
      abortTask(e.currentTarget.dataset.id);
    },
    [abortTask]
  );
}

export function useHandleClickInfo(): (
  e: MouseEvent<IButtonEl>
) => Promise<void> {
  const writeLog = useWriteLog();
  const getTaskList = useGetTaskList();
  return useCallback(
    async (e) => {
      // 非同期の時は e.currentTarget は null になってしまう
      const processId = (e.target as IButtonEl).dataset.id;
      const taskList = await getTaskList();
      const task = taskList.find((task) => task.processId === processId);
      if (task) {
        const copy = { ...task, attributes: undefined };
        writeLog({ data: JSON.stringify(copy) });
      }
    },
    [getTaskList, writeLog]
  );
}

export function useUpdateTask(): (
  process: Process,
  status: string,
  result: ICommandReturn
) => Promise<void> {
  const setTaskList = useSetRecoilState(taskListState);
  const getTaskList = useGetTaskList();
  return useCallback(
    async (process, status, result) => {
      const taskList = await getTaskList();
      const index = taskList.findIndex((task) => task.processId === process.id);
      if (index !== -1) {
        const task = cloneDeep(taskList[index]);
        task.status = status;
        task.attributes['data-status'] = status;
        task.result = cloneDeep(result);
        const newTaskList = [...taskList];
        newTaskList.splice(index, 1, task);
        setTaskList(newTaskList);
      }
    },
    [getTaskList, setTaskList]
  );
}

export function useMoveElementFocus(): (step: number, loop?: boolean) => void {
  const frameEl = useRecoilValue(frameElState(TASK_MANAGER_KEY));
  return useCallback(
    (step, loop = false) => {
      moveElementFocus(frameEl, step, loop, false);
    },
    [frameEl]
  );
}

export function useGetTaskManagerFrameEl(): () => Promise<HTMLElement | null> {
  const getFrameEl = useGetFrameEl();
  return useCallback(async () => {
    return await getFrameEl(TASK_MANAGER_KEY);
  }, [getFrameEl]);
}

export function useGetTaskManagerFrameTypeList(): () => Promise<Set<string>> {
  const getFrameTypeList = useGetFrameTypeList();
  return useCallback(async () => {
    return await getFrameTypeList(TASK_MANAGER_KEY);
  }, [getFrameTypeList]);
}

export function useSetTaskManagerFrameType(): (
  frameType: string,
  addOrDelete: boolean
) => Promise<void> {
  const setFrameType = useSetFrameType();
  return useCallback(
    async (frameType, addOrDelete) => {
      await setFrameType(TASK_MANAGER_KEY, frameType, addOrDelete);
    },
    [setFrameType]
  );
}

export function useHasTaskManagerFrameTypeOf(): (
  frameType: string
) => Promise<boolean> {
  const getFrameTypeList = useGetTaskManagerFrameTypeList();
  return useCallback(
    async (frameType) => {
      const frameTypeList = await getFrameTypeList();
      return frameTypeList.has(frameType);
    },
    [getFrameTypeList]
  );
}

export function useFocusTaskManagerFrame(): () => void {
  const focusFrame = useFocusFrame();
  return useCallback(() => {
    focusFrame(TASK_MANAGER_KEY);
  }, [focusFrame]);
}

export function useConfigureTaskManager(): (
  settings: ITaskManagerSettings
) => void {
  const setTaskFilter = useSetRecoilState(taskFilterState);
  return useCallback(
    (settings) => {
      setTaskFilter(() => settings.filter);
    },
    [setTaskFilter]
  );
}

export function useTaskManagerUpdateEffect(): void {
  const adjustScrollPosition = useAdjustScrollPosition();
  const taskList = useRecoilValue(taskListState);
  useEffect(() => {
    const el = getLastTaskEl();
    if (el) {
      adjustScrollPosition(TASK_MANAGER_KEY, el);
    }
  }, [adjustScrollPosition, taskList]); // taskList is intentional
}

export function useFocusListenerEffect(): void {
  const setFocusListener = useSetRecoilState(
    focusListenerState(TASK_MANAGER_KEY)
  );
  const frameEl = useRecoilValue(frameElState(TASK_MANAGER_KEY));
  useEffect(() => {
    setFocusListener(() => () => focusLastElement(frameEl, false));
  }, [frameEl, setFocusListener]);
}

export function useInitializationEffect(): void {
  const setLastTask = useSetRecoilState(lastTaskState);
  const updateTask = useUpdateTask();
  useEffect(() => {
    Process.on('start', (process) =>
      setLastTask(buildTaskData(process, 'start'))
    );
    Process.on('finish', (process, result) =>
      updateTask(process, 'finish', result)
    );
    Process.on('abort', (process, result) =>
      updateTask(process, 'abort', result)
    );
    Process.on('error', (process, result) =>
      updateTask(process, 'error', result)
    );
  }, [setLastTask, updateTask]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useTaskManagerExports() {
  const getFrameEl = useGetTaskManagerFrameEl();
  const getFrameTypeList = useGetTaskManagerFrameTypeList();
  const setFrameType = useSetTaskManagerFrameType();
  const hasFrameTypeOf = useHasTaskManagerFrameTypeOf();
  const focusFrame = useFocusTaskManagerFrame();
  const getTaskList = useGetTaskList();
  const abortTask = useAbortTask();
  const moveElementFocus = useMoveElementFocus();
  return useMemo(
    () => ({
      getFrameEl,
      getFrameTypeList,
      setFrameType,
      hasFrameTypeOf,
      focusFrame,
      getTaskList,
      abortTask,
      moveElementFocus,
    }),
    [
      abortTask,
      focusFrame,
      getFrameEl,
      getFrameTypeList,
      getTaskList,
      hasFrameTypeOf,
      moveElementFocus,
      setFrameType,
    ]
  );
}
