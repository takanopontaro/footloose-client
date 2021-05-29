import { atom, atomFamily, selector } from 'recoil';
import { IDialogProperties, IDialogType } from './dialog-typings';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const dialogPropertiesState = atomFamily<IDialogProperties<any>, string>(
  {
    key: 'dialog/dialogProperties',
    default: { id: '', dialogType: '' },
  }
);

export const dialogIdListState = atom<string[]>({
  key: 'dialog/dialogIdList',
  default: [],
});

export const currentDialogTypeState = selector<IDialogType>({
  key: 'dialog/currentDialogType',
  get: ({ get }) => {
    const dialogIdList = get(dialogIdListState);
    const id = dialogIdList.slice(-1)[0];
    if (!id) {
      return '';
    }
    const dialogProperties = get(dialogPropertiesState(id));
    return dialogProperties.dialogType;
  },
});

export const dialogElState = atomFamily<HTMLDialogElement | null, string>({
  key: 'dialog/dialogEl',
  default: null,
});

export const activeElState = atomFamily<HTMLElement | null, string>({
  key: 'dialog/activeEl',
  default: null,
});
