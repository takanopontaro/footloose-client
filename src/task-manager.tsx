import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { useExportsEffect } from './app-hooks';
import {
  useFocusListenerEffect,
  useHandleClickAbort,
  useHandleClickInfo,
  useInitializationEffect,
  useTaskManagerExports,
  useTaskManagerUpdateEffect,
} from './task-manager-hooks';
import { TASK_MANAGER_KEY } from './task-manager-lib';
import { taskListState } from './task-manager-recoil';

type IProps = {
  id: string;
};

const TaskManagerComponent: FC<IProps> = () => {
  const taskList = useRecoilValue(taskListState);

  const handleClickAbort = useHandleClickAbort();

  const handleClickInfo = useHandleClickInfo();

  useInitializationEffect();

  useExportsEffect(TASK_MANAGER_KEY, useTaskManagerExports());

  useFocusListenerEffect();

  useTaskManagerUpdateEffect();

  return (
    <>
      {taskList.map((task) => (
        <div key={task.processId} className="task" {...task.attributes}>
          {task.status === 'start' ? (
            <button
              type="button"
              className="task_abort"
              onClick={handleClickAbort}
              data-id={task.processId}
            />
          ) : null}
          <button
            type="button"
            className="task_info"
            onClick={handleClickInfo}
            data-id={task.processId}
          />
        </div>
      ))}
    </>
  );
};

const TaskManager = memo(TaskManagerComponent);

export { TaskManager };
