import { FC } from 'react';
import { IProperties as IItemSelectorProperties } from './item-selector-typings';

export type IDialogType = '' | 'alert' | 'confirm' | 'prompt' | 'itemSelector';

export type IDialogReturnBase = string | true | false | null;

export type IDialogReturn<T extends IDialogType> = T extends ''
  ? IDialogReturnBase
  : T extends 'confirm'
  ? Exclude<IDialogReturnBase, string>
  : T extends 'alert'
  ? Exclude<IDialogReturnBase, string | false>
  : Exclude<IDialogReturnBase, true>;

export type IDialogResolve<T extends IDialogType> = (
  value: IDialogReturn<T>
) => void;

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type IDialogPropertiesBase<T extends IDialogType> = {
  dialogType: IDialogType;
  id: string;
  className?: string;
  attributes?: Record<string, string>;
  resolve: IDialogResolve<T>;
};

export type IDialogProperties<T extends IDialogType> = T extends ''
  ? Optional<IDialogPropertiesBase<T>, 'resolve'>
  : T extends 'prompt'
  ? IDialogPropertiesBase<T> & { defaultValue: string }
  : T extends 'itemSelector'
  ? IDialogPropertiesBase<T> & IItemSelectorProperties
  : IDialogPropertiesBase<T>;

export type IDialogParameters<T extends IDialogType> = Omit<
  IDialogProperties<T>,
  'dialogType' | 'id' | 'resolve'
>;

export type IDialogContentProps = {
  id: string;
};

export type IDialogDetails = {
  id: string;
  Component: FC<IDialogContentProps>;
};
