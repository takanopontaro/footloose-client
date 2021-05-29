import { DefaultValue, atom, selector } from 'recoil';
import { convertToDataAttributes, genUid } from './app-lib';
import { ILog, ILogData, ILogFilter } from './log-typings';

export const logFilterState = atom<ILogFilter>({
  key: 'log/logFilter',
  default: () => true,
});

export const logDataState = atom<ILog[]>({
  key: 'log/logData',
  default: [],
});

export const lastLogState = selector<ILogData>({
  key: 'log/lastLog',
  get: ({ get }) => {
    const logData = get(logDataState);
    return logData.slice(-1)[0];
  },
  set: ({ get, set }, newValue) => {
    if (newValue instanceof DefaultValue) {
      return;
    }
    const filter = get(logFilterState);
    if (!filter(newValue)) {
      return;
    }
    const id = genUid();
    const attributes = convertToDataAttributes(newValue.attributes);
    const logData = [...get(logDataState), { ...newValue, id, attributes }];
    if (logData.length > 1000) {
      logData.shift();
    }
    set(logDataState, logData);
  },
});
