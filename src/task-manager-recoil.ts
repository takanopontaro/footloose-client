import { DefaultValue, atom, selector } from 'recoil';
import { ITask, ITaskFilter } from './task-manager-typings';

export const taskFilterState = atom<ITaskFilter>({
  key: 'taskManager/taskFilter',
  default: () => true,
});

export const taskListState = atom<ITask[]>({
  key: 'taskManager/taskList',
  default: [],
});

export const lastTaskState = selector<ITask>({
  key: 'taskManager/lastTask',
  get: ({ get }) => {
    const taskList = get(taskListState);
    return taskList.slice(-1)[0];
  },
  set: ({ get, set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }
    const filter = get(taskFilterState);
    if (!filter(newValue)) {
      return;
    }
    const taskList = [...get(taskListState), newValue];
    if (taskList.length > 500) {
      taskList.shift();
    }
    set(taskListState, taskList);
  },
});
