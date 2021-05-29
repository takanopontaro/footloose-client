import { AlertDialog, ConfirmDialog, PromptDialog } from './dialog-contents';
import { IDialogDetails, IDialogType } from './dialog-typings';
import { ItemSelector } from './item-selector';
import { ITEM_SELECTOR_KEY } from './item-selector-lib';

export const DIALOG_KEY = 'dialog' as const;

export function getInputEl(): HTMLInputElement | null {
  return document.querySelector('.dialog_input');
}

export function isPartOfDialog(el: unknown): el is HTMLElement {
  return el instanceof HTMLElement && el.closest('.dialog_inner') !== null;
}

export function getDialogDetails(dialogType: IDialogType): IDialogDetails {
  switch (dialogType) {
    case 'prompt': {
      return { id: DIALOG_KEY, Component: PromptDialog };
    }
    case 'confirm': {
      return { id: DIALOG_KEY, Component: ConfirmDialog };
    }
    case 'alert': {
      return { id: DIALOG_KEY, Component: AlertDialog };
    }
    case 'itemSelector': {
      return { id: ITEM_SELECTOR_KEY, Component: ItemSelector };
    }
    default: {
      throw new Error();
    }
  }
}
