import { Process } from './process';
import { ITask } from './task-manager-typings';

export const TASK_MANAGER_KEY = 'taskManager' as const;

export function getLastTaskEl(): HTMLElement | null {
  return document.querySelector(`#${TASK_MANAGER_KEY} .task:last-child`);
}

export function buildTaskData(process: Process, status: string): ITask {
  return {
    processId: process.id,
    status,
    command: process.command,
    parameters: process.parameters,
    attributes: {
      'data-status': status,
      'data-command': process.command,
      'data-process-id': process.id,
    },
  };
}
