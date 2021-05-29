import { ChangeEvent, RefObject, useCallback, useEffect, useMemo } from 'react';
import {
  RecoilState,
  useRecoilCallback,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { useGetRecoilValueFamily } from './app-hooks';
import { getFilterInputId } from './filter-input-lib';
import { filterRecoilState, inputElState } from './filter-input-recoil';
import { deleteShortcut, setAllShortcutsSuspensions } from './shortcut';

export function useGetFilterInputEl(): (
  frameId: string
) => Promise<HTMLInputElement | null> {
  const getInputEl = useGetRecoilValueFamily(inputElState);
  return useCallback(
    async (frameId) => {
      const id = getFilterInputId(frameId);
      return await getInputEl(id);
    },
    [getInputEl]
  );
}

export function useFocusFilterInput(): (frameId: string) => Promise<void> {
  const getFilterInputEl = useGetFilterInputEl();
  return useCallback(
    async (frameId) => {
      const inputEl = await getFilterInputEl(frameId);
      inputEl?.focus({ preventScroll: true });
    },
    [getFilterInputEl]
  );
}

export function useHandleFocus(frameId: string): () => void {
  return useCallback(() => {
    const id = getFilterInputId(frameId);
    setAllShortcutsSuspensions(true, [id]);
  }, [frameId]);
}

export function useHandleBlur(): () => void {
  return useCallback(() => {
    setAllShortcutsSuspensions(false);
  }, []);
}

export function useHandleChange(
  frameId: string
): (e: ChangeEvent<HTMLInputElement>) => void {
  const id = getFilterInputId(frameId);
  const filterState = useRecoilValue(filterRecoilState(id));
  return useRecoilCallback(
    ({ set }) =>
      (e) => {
        if (filterState) {
          set(filterState, e.currentTarget.value);
        }
      },
    [filterState]
  );
}

export function useInitializationEffect(
  frameId: string,
  inputElRef: RefObject<HTMLInputElement>,
  filterState: RecoilState<string>
): void {
  const id = getFilterInputId(frameId);
  const setInputEl = useSetRecoilState(inputElState(id));
  const setFilterState = useSetRecoilState(filterRecoilState(id));
  useEffect(() => {
    setInputEl(inputElRef.current);
    setFilterState(filterState);
    return () => {
      deleteShortcut(id);
      setAllShortcutsSuspensions(false);
    };
  }, [filterState, id, inputElRef, setFilterState, setInputEl]);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function useFilterInputExports() {
  const focus = useFocusFilterInput();
  return useMemo(() => ({ focus }), [focus]);
}
