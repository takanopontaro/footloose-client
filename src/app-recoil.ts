import { DefaultValue, atom, atomFamily, selector } from 'recoil';
import { APP_KEY } from './app-lib';
import { IAllExports, IBootstrap } from './app-typings';
import { DIALOG_KEY } from './dialog-lib';
import { DIRECTORY_KEY } from './directory-lib';
import { FILTER_INPUT_KEY } from './filter-input-lib';
import { ITEM_SELECTOR_KEY } from './item-selector-lib';
import { LOG_KEY } from './log-lib';
import { Settings } from './settings';
import { IKeyBindings } from './shortcut';
import { TASK_MANAGER_KEY } from './task-manager-lib';

export const persistentSettingsState = atom<boolean>({
  key: 'app/persistentSettings',
  default: false,
  effects_UNSTABLE: [
    ({ onSet, setSelf }) => {
      setSelf(Settings.persistent);
      onSet((newValue) => {
        if (!(newValue instanceof DefaultValue)) {
          Settings.persistent = newValue;
        }
      });
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const exportsState = atomFamily<any, string>({
  key: 'app/exports',
  default: {},
});

export const allExportsState = selector<IAllExports>({
  key: 'app/allExports',
  get: ({ get }) => ({
    [APP_KEY]: get(exportsState(APP_KEY)),
    [DIALOG_KEY]: get(exportsState(DIALOG_KEY)),
    [ITEM_SELECTOR_KEY]: get(exportsState(ITEM_SELECTOR_KEY)),
    [DIRECTORY_KEY]: get(exportsState(DIRECTORY_KEY)),
    [FILTER_INPUT_KEY]: get(exportsState(FILTER_INPUT_KEY)),
    [LOG_KEY]: get(exportsState(LOG_KEY)),
    [TASK_MANAGER_KEY]: get(exportsState(TASK_MANAGER_KEY)),
  }),
});

export const bootstrapState = atom<IBootstrap>({
  key: 'app/bootstrap',
  default: {
    getSettings: async () => ({
      [APP_KEY]: {
        persistentSettings: false,
      },
      [DIRECTORY_KEY]: {
        selectedRowsOnly: false,
        openPathApps: {},
        frames: [
          { sorts: [], filter: '', path: '', previewMaker: () => '' },
          { sorts: [], filter: '', path: '', previewMaker: () => '' },
        ],
      },
      [LOG_KEY]: {
        filter: () => true,
      },
      [TASK_MANAGER_KEY]: {
        filter: () => true,
      },
    }),
    getKeyMaps: async () => ({
      [APP_KEY]: {},
      [DIALOG_KEY]: {},
      [ITEM_SELECTOR_KEY]: {},
      [DIRECTORY_KEY]: {},
      [FILTER_INPUT_KEY]: {},
      [LOG_KEY]: {},
      [TASK_MANAGER_KEY]: {},
    }),
  },
});

export const keyBindingsState = atomFamily<IKeyBindings, string>({
  key: 'app/keyBindings',
  default: {},
});

export const focusedFrameIdState = atom<string>({
  key: 'app/focusedFrameId',
  default: '',
});
