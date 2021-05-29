import dialogPolyfill from 'dialog-polyfill';
import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  useRecoilCallback,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState,
} from 'recoil';
import { useGetRecoilValue } from './app-hooks';
import {
  addClassNamePrefix,
  convertToDataAttributes,
  focusAsync,
  moveElementFocus,
} from './app-lib';
import { exportsState } from './app-recoil';
import { getDialogDetails, getInputEl, isPartOfDialog } from './dialog-lib';
import {
  activeElState,
  currentDialogTypeState,
  dialogElState,
  dialogIdListState,
  dialogPropertiesState,
} from './dialog-recoil';
import {
  IDialogParameters,
  IDialogReturn,
  IDialogType,
} from './dialog-typings';
import { deleteShortcut, setAllShortcutsSuspensions } from './shortcut';

export function useGetCurrentDialogType(): () => Promise<IDialogType> {
  return useGetRecoilValue(currentDialogTypeState);
}

export function useGetDialogEl(id: string): () => HTMLDialogElement | null {
  const dialogEl = useRecoilValue(dialogElState(id));
  return useCallback(() => {
    return dialogEl;
  }, [dialogEl]);
}

export function useCloseDialog(id: string): () => void {
  const setDialogIdList = useSetRecoilState(dialogIdListState);
  return useCallback(() => {
    setDialogIdList((list) => list.filter((item) => item !== id));
  }, [id, setDialogIdList]);
}

export function useRejectDialog(id: string): (value: false | null) => void {
  const close = useCloseDialog(id);
  const dialogProperties = useRecoilValue(dialogPropertiesState(id));
  return useCallback(
    (value) => {
      dialogProperties.resolve?.(value);
      close();
    },
    [close, dialogProperties]
  );
}

export function useCancelDialog(id: string): () => void {
  const reject = useRejectDialog(id);
  return useCallback(() => {
    reject(false);
  }, [reject]);
}

export function useResolveDialog(id: string): (value?: string) => void {
  const close = useCloseDialog(id);
  const dialogProperties = useRecoilValue(dialogPropertiesState(id));
  return useCallback(
    (value) => {
      const inputEl = getInputEl();
      dialogProperties.resolve?.(value ?? inputEl?.value.trim() ?? true);
      close();
    },
    [close, dialogProperties]
  );
}

export function useProcessDialog(id: string): () => boolean {
  const resolve = useResolveDialog(id);
  return useCallback(() => {
    const inputEl = getInputEl();
    if (inputEl === document.activeElement) {
      resolve();
      return false;
    }
    return true;
  }, [resolve]);
}

export function useHandleClick(id: string): () => void {
  const resolve = useResolveDialog(id);
  return useCallback(() => {
    resolve();
  }, [resolve]);
}

export function useMoveElementFocus(
  id: string
): (step: number, loop?: boolean) => void {
  const dialogEl = useRecoilValue(dialogElState(id));
  return useCallback(
    (step, loop = false) => {
      moveElementFocus(dialogEl, step, loop);
    },
    [dialogEl]
  );
}

export function useGetActiveEl(id: string): () => Promise<HTMLElement | null> {
  return useGetRecoilValue(activeElState(id));
}

export function useOnDialogCancel(id: string): (e: Event) => void {
  const reject = useRejectDialog(id);
  return useCallback(
    (e) => {
      e.preventDefault();
      reject(null);
    },
    [reject]
  );
}

export function useOnDialogClick(id: string): () => Promise<void> {
  const getActiveEl = useGetActiveEl(id);
  return useCallback(async () => {
    const activeEl = await getActiveEl();
    activeEl?.focus({ preventScroll: true });
  }, [getActiveEl]);
}

export function useOnDialogFocus(id: string): (e: FocusEvent) => void {
  const setActiveElement = useSetRecoilState(activeElState(id));
  return useCallback(
    (e) => {
      if (isPartOfDialog(e.target)) {
        setActiveElement(e.target);
      }
    },
    [setActiveElement]
  );
}

export function useDialog<T extends IDialogType>(
  dialogType: T
): (parameters: IDialogParameters<T>) => Promise<IDialogReturn<T>> {
  return useRecoilCallback(
    ({ set }) =>
      (parameters) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new Promise((resolve: any) => {
          const id = getDialogDetails(dialogType).id;
          const properties = {
            ...parameters,
            dialogType,
            id,
            className: addClassNamePrefix(parameters.className, 'dialog'),
            attributes: convertToDataAttributes(parameters.attributes),
            resolve,
          };
          set(dialogPropertiesState(id), properties);
          set(dialogIdListState, (list) => [...list, id]);
        }),
    [dialogType]
  );
}

export function useInitializationEffect(
  id: string,
  dialogElRef: RefObject<HTMLDialogElement>
): void {
  const activeElRef = useRef<Element | null>(null);
  const setDialogEl = useSetRecoilState(dialogElState(id));
  const resetDialogEl = useResetRecoilState(dialogElState(id));
  const resetActiveEl = useResetRecoilState(activeElState(id));
  const resetExports = useResetRecoilState(exportsState(id));
  const onDialogCancel = useOnDialogCancel(id);
  const onDialogClick = useOnDialogClick(id);
  const onDialogFocus = useOnDialogFocus(id);
  useEffect(() => {
    const dialogEl = dialogElRef.current;
    if (!dialogEl) {
      return;
    }
    setDialogEl(dialogEl);
    dialogPolyfill.registerDialog(dialogEl);
    dialogEl.addEventListener('cancel', onDialogCancel);
    dialogEl.addEventListener('click', onDialogClick);
    dialogEl.addEventListener('focus', onDialogFocus, true);
    setAllShortcutsSuspensions(true, [id]);
    activeElRef.current = document.activeElement;
    dialogEl.showModal();
    dialogEl.scrollTo(0, 0);
    return () => {
      deleteShortcut(id);
      setAllShortcutsSuspensions(false);
      focusAsync(activeElRef.current as HTMLElement);
      resetDialogEl();
      resetActiveEl();
      resetExports();
    };
  }, [
    dialogElRef,
    id,
    onDialogCancel,
    onDialogClick,
    onDialogFocus,
    resetActiveEl,
    resetDialogEl,
    resetExports,
    setDialogEl,
  ]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useDialogExports(id: string) {
  const getDialogEl = useGetDialogEl(id);
  const reject = useRejectDialog(id);
  const cancel = useCancelDialog(id);
  const resolve = useResolveDialog(id);
  const process = useProcessDialog(id);
  const getActiveEl = useGetActiveEl(id);
  const moveElementFocus = useMoveElementFocus(id);
  return useMemo(
    () => ({
      getDialogEl,
      reject,
      cancel,
      resolve,
      process,
      getActiveEl,
      moveElementFocus,
    }),
    [
      cancel,
      getActiveEl,
      getDialogEl,
      moveElementFocus,
      process,
      reject,
      resolve,
    ]
  );
}
