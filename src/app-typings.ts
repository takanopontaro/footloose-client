import { IEntry, IOpenPathApp } from 'footloose';
import { useAppExports } from './app-hooks';
import { APP_KEY } from './app-lib';
import { useDialogExports } from './dialog-hooks';
import { DIALOG_KEY } from './dialog-lib';
import { useDirectoryExports } from './directory-hooks';
import { DIRECTORY_KEY } from './directory-lib';
import { IDirectorySettings } from './directory-typings';
import { useFilterInputExports } from './filter-input-hooks';
import { FILTER_INPUT_KEY } from './filter-input-lib';
import { useItemSelectorExports } from './item-selector-hooks';
import { ITEM_SELECTOR_KEY } from './item-selector-lib';
import { useLogExports } from './log-hooks';
import { LOG_KEY } from './log-lib';
import { ILogSettings } from './log-typings';
import { IKeyBindings } from './shortcut';
import { useTaskManagerExports } from './task-manager-hooks';
import { TASK_MANAGER_KEY } from './task-manager-lib';
import { ITaskManagerSettings } from './task-manager-typings';

export { IEntry, IOpenPathApp };

export type INullableElement = HTMLElement | null | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IEventListener = (event: any, ...args: any[]) => void;

export type OmitFirstParameter<F> = F extends (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  x: any,
  ...args: infer P
) => infer R
  ? (...args: P) => R
  : never;

export type IAppSettings = {
  persistentSettings: boolean;
};

export type ISettings = {
  [APP_KEY]: IAppSettings;
  [DIRECTORY_KEY]: {
    selectedRowsOnly: boolean;
    openPathApps: Record<string, IOpenPathApp>;
    frames: IDirectorySettings[];
  };
  [LOG_KEY]: ILogSettings;
  [TASK_MANAGER_KEY]: ITaskManagerSettings;
};

export type IKeyMaps = {
  [APP_KEY]: IKeyBindings;
  [DIALOG_KEY]: IKeyBindings;
  [ITEM_SELECTOR_KEY]: IKeyBindings;
  [DIRECTORY_KEY]: IKeyBindings;
  [FILTER_INPUT_KEY]: IKeyBindings;
  [LOG_KEY]: IKeyBindings;
  [TASK_MANAGER_KEY]: IKeyBindings;
};

export type IGetSettings = () => Promise<ISettings>;

export type IGetKeyMaps = (allExports: IAllExports) => Promise<IKeyMaps>;

export type IBootstrap = {
  getSettings: IGetSettings;
  getKeyMaps: IGetKeyMaps;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IFunction = (...args: any[]) => any;

export type IExports = Record<string, IFunction | Record<string, IFunction>>;

export type IAllExports = {
  [APP_KEY]: ReturnType<typeof useAppExports>;
  [DIALOG_KEY]: ReturnType<typeof useDialogExports>;
  [ITEM_SELECTOR_KEY]: ReturnType<typeof useItemSelectorExports>;
  [DIRECTORY_KEY]: ReturnType<typeof useDirectoryExports>;
  [FILTER_INPUT_KEY]: ReturnType<typeof useFilterInputExports>;
  [LOG_KEY]: ReturnType<typeof useLogExports>;
  [TASK_MANAGER_KEY]: ReturnType<typeof useTaskManagerExports>;
};
