import EventEmitter from 'eventemitter3';
import { ICommandReturn, IEntry, IUnwatch, IWatch } from 'footloose';
import { Socket, io } from 'socket.io-client';
import { IEventListener, OmitFirstParameter } from './app-typings';
import { Process } from './process';

declare global {
  interface Window {
    io: typeof io;
  }
}

type IConnectionDirectoryUpdate = (
  event: 'directoryUpdate',
  directoryPath: string,
  entries: IEntry[]
) => void;

type IConnectionDirectoryError = (
  event: 'directoryError',
  directoryPath: string,
  message: string
) => void;

class ConnectionClass {
  ee: EventEmitter;
  socket: Socket;
  watchInfo = new Map<string, Set<string>>();

  constructor() {
    this.ee = new EventEmitter();
    this.socket = window.io();
    this.socket.on('command', this.handleCommand.bind(this));
    this.socket.on('directoryUpdate', this.handleEntries.bind(this));
    this.socket.on('error', this.handleError.bind(this));
  }

  on<T extends IEventListener>(
    event: Parameters<T>[0],
    fn: OmitFirstParameter<T>
  ): void {
    this.ee.on.apply(this.ee, [event, fn]);
  }

  emit<T extends IEventListener>(...args: Parameters<T>): void {
    // eslint-disable-next-line prefer-spread
    this.ee.emit.apply(this.ee, args);
  }

  send(command: string, processId: string, parameters?: unknown): void {
    this.socket.emit('command', command, processId, parameters);
  }

  setWatchInfo(frameId: string, directoryPath: string): void {
    const frameIdList = this.watchInfo.get(directoryPath) ?? new Set();
    frameIdList.add(frameId);
    this.watchInfo.set(directoryPath, frameIdList);
  }

  watchDirectory(directoryPath: string): void {
    const process = new Process<IWatch>('watch', { directoryPath });
    process.run();
  }

  unwatchDirectory(frameId: string, directoryPath: string): void {
    const frameIdList = this.watchInfo.get(directoryPath);
    frameIdList?.delete(frameId);
    if (!frameIdList || frameIdList.size === 0) {
      this.watchInfo.delete(directoryPath);
      const process = new Process<IUnwatch>('unwatch', { directoryPath });
      process.run();
    }
  }

  handleCommand(processId: string, result: ICommandReturn): void {
    Process.release(processId, result);
  }

  handleError(directoryPath: string, message: string): void {
    this.emit<IConnectionDirectoryError>(
      'directoryError',
      directoryPath,
      message
    );
  }

  handleEntries(directoryPath: string, entries: IEntry[]): void {
    this.emit<IConnectionDirectoryUpdate>(
      'directoryUpdate',
      directoryPath,
      entries
    );
  }
}

const Connection = new ConnectionClass();

export { Connection, IConnectionDirectoryUpdate, IConnectionDirectoryError };
