import { FocusEvent, RefObject, useCallback, useEffect, useMemo } from 'react';
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';
import { useGetRecoilValue } from './app-hooks';
import {
  cycleIndex,
  focusAsync,
  moveElementFocus,
  scrollIntoView,
} from './app-lib';
import {
  useCancelDialog,
  useCloseDialog,
  useRejectDialog,
} from './dialog-hooks';
import { dialogElState, dialogPropertiesState } from './dialog-recoil';
import { IDialogProperties } from './dialog-typings';
import {
  useFocusFilterInput as useFocusFilterInputHook,
  useGetFilterInputEl,
} from './filter-input-hooks';
import {
  ITEM_SELECTOR_KEY,
  activateItem,
  getActiveItem,
  getSiblingItem,
  hasActiveItem,
  reactivateItem,
} from './item-selector-lib';
import {
  buttonElState,
  deletionListenerState,
  filteredItemsState,
  itemFilterState,
  itemListElState,
  originalItemsState,
} from './item-selector-recoil';
import { IItemEl } from './item-selector-typings';

export function useFocusFilterInput(): () => Promise<void> {
  const focusFilterInput = useFocusFilterInputHook();
  return useCallback(async () => {
    await focusFilterInput(ITEM_SELECTOR_KEY);
  }, [focusFilterInput]);
}

export function useGetItemFilter(): () => Promise<string> {
  return useGetRecoilValue(itemFilterState);
}

export function useSetItemFilter(): (value: string) => void {
  const setItemFilter = useSetRecoilState(itemFilterState);
  return useCallback(
    (value) => {
      setItemFilter(value);
    },
    [setItemFilter]
  );
}

export function useResolveItemSelector(): (value?: string) => void {
  const close = useCloseDialog(ITEM_SELECTOR_KEY);
  const dialogProperties = useRecoilValue(
    dialogPropertiesState(ITEM_SELECTOR_KEY)
  );
  return useCallback(
    (value) => {
      if (value !== undefined) {
        dialogProperties.resolve?.(value);
        close();
        return;
      }
      const activeItem = getActiveItem();
      if (activeItem) {
        dialogProperties.resolve?.(activeItem.dataset.value);
        close();
      }
    },
    [close, dialogProperties]
  );
}

export function useHandleFocus(): (e: FocusEvent<IItemEl>) => void {
  return useCallback((e) => {
    activateItem(e.currentTarget, false);
  }, []);
}

export function useHandleClick(): () => void {
  const resolve = useResolveItemSelector();
  return useCallback(() => {
    resolve();
  }, [resolve]);
}

export function useSwitchFocusContext(): (step: number) => Promise<void> {
  const focusFilterInput = useFocusFilterInput();
  const getFilterInputEl = useGetFilterInputEl();
  const buttonEl = useRecoilValue(buttonElState);
  return useCallback(
    async (step) => {
      const inputEl = await getFilterInputEl(ITEM_SELECTOR_KEY);
      if (!inputEl || !buttonEl) {
        return;
      }
      const activeItem = getActiveItem();
      const list = [inputEl, activeItem, buttonEl];
      const index = list.findIndex((el) => el === document.activeElement);
      const newIndex = index === -1 ? 0 : cycleIndex(index, list.length, step);
      const targetEl = list[newIndex];
      if (targetEl === inputEl) {
        focusFilterInput();
        return;
      }
      if (targetEl === buttonEl) {
        buttonEl.focus({ preventScroll: true });
        return;
      }
      const successful = reactivateItem() || activateItem(0, true);
      if (!successful) {
        const el = step < 0 ? inputEl : buttonEl;
        el?.focus({ preventScroll: true });
      }
    },
    [buttonEl, focusFilterInput, getFilterInputEl]
  );
}

export function useCursorMove(): (step: number, loop?: boolean) => void {
  const dialogEl = useRecoilValue(dialogElState(ITEM_SELECTOR_KEY));
  const itemListEl = useRecoilValue(itemListElState);
  return useCallback(
    (step, loop = false) => {
      const activeItem = getActiveItem();
      activeItem?.focus({ preventScroll: true });
      const el = moveElementFocus(itemListEl, step, loop);
      scrollIntoView(el, dialogEl);
    },
    [dialogEl, itemListEl]
  );
}

export function useDeleteItem(): (value?: string) => void {
  const deletionListener = useRecoilValue(deletionListenerState);
  const setOriginalItems = useSetRecoilState(originalItemsState);
  return useCallback(
    (value) => {
      const activeItem = getActiveItem();
      value = value ?? activeItem?.dataset.value;
      if (value === undefined) {
        return;
      }
      const siblingItem = activeItem ? getSiblingItem(activeItem) : null;
      setOriginalItems((items) => items.filter((item) => item.value !== value));
      deletionListener?.(value);
      focusAsync(siblingItem);
    },
    [deletionListener, setOriginalItems]
  );
}

export function useProcessItemSelector(): () => Promise<void> {
  const getFilterInputEl = useGetFilterInputEl();
  const buttonEl = useRecoilValue(buttonElState);
  const setItemFilter = useSetItemFilter();
  const resolve = useResolveItemSelector();
  const cancel = useCancelDialog(ITEM_SELECTOR_KEY);
  return useCallback(async () => {
    const inputEl = await getFilterInputEl(ITEM_SELECTOR_KEY);
    if (!inputEl || !buttonEl) {
      return;
    }
    switch (document.activeElement) {
      case inputEl: {
        setItemFilter('');
        reactivateItem();
        break;
      }
      case buttonEl: {
        cancel();
        break;
      }
      default: {
        resolve();
      }
    }
  }, [buttonEl, cancel, getFilterInputEl, resolve, setItemFilter]);
}

export function useActiveItemFixEffect(): void {
  const dialogEl = useRecoilValue(dialogElState(ITEM_SELECTOR_KEY));
  const filteredItems = useRecoilValue(filteredItemsState);
  useEffect(() => {
    if (!hasActiveItem()) {
      activateItem(0, false);
    }
    const item = getActiveItem();
    scrollIntoView(item, dialogEl);
  }, [filteredItems, dialogEl]); // filteredItems is intentional
}

export function useInitializationEffect(
  itemListElRef: RefObject<HTMLDivElement>,
  buttonElRef: RefObject<HTMLButtonElement>
): void {
  const { dataSet, onDelete } = useRecoilValue(
    dialogPropertiesState(ITEM_SELECTOR_KEY)
  ) as IDialogProperties<'itemSelector'>;
  const setItemListEl = useSetRecoilState(itemListElState);
  const setButtonEl = useSetRecoilState(buttonElState);
  const setItemFilter = useSetItemFilter();
  const setDeletionListener = useSetRecoilState(deletionListenerState);
  const setOriginalItems = useSetRecoilState(originalItemsState);
  const resetItemListEl = useResetRecoilState(itemListElState);
  const resetButtonEl = useResetRecoilState(buttonElState);
  const resetItemFilter = useResetRecoilState(itemFilterState);
  const resetDeletionListener = useResetRecoilState(deletionListenerState);
  const resetOriginalItems = useResetRecoilState(originalItemsState);
  useEffect(() => {
    setItemListEl(itemListElRef.current);
    setButtonEl(buttonElRef.current);
    setItemFilter('');
    setDeletionListener(onDelete ? () => onDelete : null);
    setOriginalItems(dataSet);
    return () => {
      resetItemListEl();
      resetButtonEl();
      resetItemFilter();
      resetDeletionListener();
      resetOriginalItems();
    };
  }, [
    buttonElRef,
    dataSet,
    itemListElRef,
    onDelete,
    resetButtonEl,
    resetDeletionListener,
    resetItemFilter,
    resetItemListEl,
    resetOriginalItems,
    setButtonEl,
    setDeletionListener,
    setItemFilter,
    setItemListEl,
    setOriginalItems,
  ]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useItemSelectorExports() {
  const focusFilterInput = useFocusFilterInput();
  const getItemFilter = useGetItemFilter();
  const setItemFilter = useSetItemFilter();
  const reject = useRejectDialog(ITEM_SELECTOR_KEY);
  const cancel = useCancelDialog(ITEM_SELECTOR_KEY);
  const resolve = useResolveItemSelector();
  const process = useProcessItemSelector();
  const switchFocusContext = useSwitchFocusContext();
  const cursorMove = useCursorMove();
  const deleteItem = useDeleteItem();
  return useMemo(
    () => ({
      focusFilterInput,
      getItemFilter,
      setItemFilter,
      reject,
      cancel,
      resolve,
      process,
      switchFocusContext,
      cursorMove,
      deleteItem,
    }),
    [
      cancel,
      cursorMove,
      deleteItem,
      focusFilterInput,
      getItemFilter,
      process,
      reject,
      resolve,
      setItemFilter,
      switchFocusContext,
    ]
  );
}
