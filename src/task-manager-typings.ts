import { ICommandReturn } from 'footloose';
import { Process } from './process';

export interface IButtonEl extends HTMLButtonElement {
  dataset: {
    id: string;
  };
}

export type ITask = {
  processId: Process['id'];
  status: string;
  command: Process['command'];
  parameters: Process['parameters'];
  attributes: Record<
    'data-status' | 'data-command' | 'data-process-id',
    string
  >;
  result?: ICommandReturn;
};

export type ITaskFilter = (task: ITask) => boolean;

export type ITaskManagerSettings = {
  filter: ITaskFilter;
};
