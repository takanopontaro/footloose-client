import { atomFamily } from 'recoil';
import { IFocusListener } from './frame-typings';

export const frameTypeListState = atomFamily<Set<string>, string>({
  key: 'frame/frameTypeList',
  default: new Set(),
});

export const frameElState = atomFamily<HTMLElement | null, string>({
  key: 'frame/frameEl',
  default: null,
});

export const focusListenerState = atomFamily<IFocusListener | null, string>({
  key: 'frame/focusListener',
  default: null,
});
