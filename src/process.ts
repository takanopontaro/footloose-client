import EventEmitter from 'eventemitter3';
import { ICommandReturn } from 'footloose';
import { genUid } from './app-lib';
import { IEventListener } from './app-typings';
import { Connection } from './connection';
import { useWriteLog } from './log-hooks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICommandListener = (command: any, ...args: any[]) => ICommandReturn;

type ICommandName<T extends IEventListener> = Parameters<T>[0];

type ICommandParameters<T extends IEventListener> = Parameters<T>[2];

type IListener<T extends ICommandListener, P> = P extends 'start'
  ? () => void
  : (result: ReturnType<T>) => void;

type IProcessListener<P extends string> = P extends 'start'
  ? (process: Process) => void
  : (process: Process, result: ICommandReturn) => void;

const runningProcess = new Map<string, Process>();

class Process<T extends ICommandListener = ICommandListener> {
  static ee = new EventEmitter();
  static writeLog?: ReturnType<typeof useWriteLog>;

  id = genUid();
  ee: EventEmitter;
  command: ICommandName<T>;
  parameters: ICommandParameters<T>;

  constructor(command: ICommandName<T>, parameters: ICommandParameters<T>) {
    this.ee = new EventEmitter();
    this.command = command;
    this.parameters = parameters;
    this.addListeners();
    runningProcess.set(this.id, this);
  }

  static release(processId: string, result: ICommandReturn): void {
    runningProcess.get(processId)?.finish(result);
    runningProcess.delete(processId);
  }

  static on<P extends string>(event: P, fn: IProcessListener<P>): void {
    Process.ee.on(event, fn);
  }

  static abort(processId: string): void {
    runningProcess.get(processId)?.abort();
  }

  on<P extends string>(event: P, fn: IListener<T, P>): void {
    this.ee.on(event, fn);
  }

  writeLog(className: string, error?: string): void {
    const logData = {
      data: error ?? '',
      className,
      attributes: { 'command': this.command, 'process-id': this.id },
    };
    Process.writeLog?.(logData);
  }

  addListeners(): void {
    this.on('start', () => this.writeLog('commandStart'));
    this.on('finish', () => this.writeLog('commandFinish'));
    this.on('abort', () => this.writeLog('commandAbort'));
    this.on('error', ({ error }) => this.writeLog('commandError', error));
  }

  run(): void {
    Connection.send(this.command, this.id, this.parameters);
    this.ee.emit('start');
    Process.ee.emit('start', this);
  }

  abort(): void {
    Connection.send('abort', this.id);
  }

  finish(result: ReturnType<T>): void {
    this.ee.emit(result.status, result);
    Process.ee.emit(result.status, this, result);
  }
}

export { Process, ICommandListener, ICommandName, ICommandParameters };
