import { FC, memo } from 'react';
import { useRecoilValue } from 'recoil';
import { useExportsEffect } from './app-hooks';
import {
  useCancelDialog,
  useDialogExports,
  useHandleClick,
} from './dialog-hooks';
import { dialogPropertiesState } from './dialog-recoil';
import { IDialogContentProps, IDialogProperties } from './dialog-typings';

const PromptDialogComponent: FC<IDialogContentProps> = ({ id }) => {
  const { defaultValue } = useRecoilValue(
    dialogPropertiesState(id)
  ) as IDialogProperties<'prompt'>;

  const cancel = useCancelDialog(id);

  const resolve = useHandleClick(id);

  useExportsEffect(id, useDialogExports(id));

  return (
    <>
      <p className="dialog_message" />
      <input
        type="text"
        className="mousetrap dialog_input"
        defaultValue={defaultValue}
      />
      <div className="dialog_foot">
        <button type="button" className="dialog_cancel" onClick={cancel} />
        <button type="button" className="dialog_ok" onClick={resolve} />
      </div>
    </>
  );
};

const PromptDialog = memo(PromptDialogComponent);

const ConfirmDialogComponent: FC<IDialogContentProps> = ({ id }) => {
  const cancel = useCancelDialog(id);

  const resolve = useHandleClick(id);

  useExportsEffect(id, useDialogExports(id));

  return (
    <>
      <p className="dialog_message" />
      <div className="dialog_foot">
        <button type="button" className="dialog_cancel" onClick={cancel} />
        <button type="button" className="dialog_ok" onClick={resolve} />
      </div>
    </>
  );
};

const ConfirmDialog = memo(ConfirmDialogComponent);

const AlertDialogComponent: FC<IDialogContentProps> = ({ id }) => {
  const resolve = useHandleClick(id);

  useExportsEffect(id, useDialogExports(id));

  return (
    <>
      <p className="dialog_message" />
      <div className="dialog_foot">
        <button type="button" className="dialog_ok" onClick={resolve} />
      </div>
    </>
  );
};

const AlertDialog = memo(AlertDialogComponent);

export { PromptDialog, ConfirmDialog, AlertDialog };
