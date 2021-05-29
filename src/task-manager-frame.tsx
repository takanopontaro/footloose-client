import { FC, memo } from 'react';
import { Frame } from './frame';
import { TaskManager } from './task-manager';
import { TASK_MANAGER_KEY } from './task-manager-lib';

type IProps = {
  id: string;
};

const TaskManagerFrameComponent: FC<IProps> = ({ id }) => (
  <Frame id={id} type={TASK_MANAGER_KEY}>
    <TaskManager id={id} />
  </Frame>
);

const TaskManagerFrame = memo(TaskManagerFrameComponent);

export { TaskManagerFrame };
