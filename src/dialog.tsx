import { FC, memo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useKeyboardShortcutsEffect } from './app-hooks';
import { useInitializationEffect } from './dialog-hooks';
import { getDialogDetails } from './dialog-lib';
import { dialogPropertiesState } from './dialog-recoil';

type IProps = {
  id: string;
};

const DialogComponent: FC<IProps> = ({ id }) => {
  const dialogElRef = useRef<HTMLDialogElement>(null);

  const {
    attributes,
    className = '',
    dialogType,
  } = useRecoilValue(dialogPropertiesState(id));

  const { Component } = getDialogDetails(dialogType);

  const polyfillClassName = window.HTMLDialogElement ? '' : 'dialog-polyfill';

  useKeyboardShortcutsEffect(id, id, dialogElRef);

  useInitializationEffect(id, dialogElRef);

  return (
    <dialog
      ref={dialogElRef}
      id={id}
      className={`dialog ${polyfillClassName} ${className}`}
      {...attributes}
      data-type={dialogType}
    >
      <div className="dialog_inner">
        <Component id={id} />
      </div>
    </dialog>
  );
};

const Dialog = memo(DialogComponent);

export { Dialog };
