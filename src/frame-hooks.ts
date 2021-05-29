import { FocusEvent, RefObject, useCallback, useEffect } from 'react';
import { useRecoilCallback, useSetRecoilState } from 'recoil';
import { useGetFocusedFrameId, useGetRecoilValueFamily } from './app-hooks';
import { scrollIntoView } from './app-lib';
import { focusedFrameIdState } from './app-recoil';
import { INullableElement } from './app-typings';
import { createFrameTypeListSetter } from './frame-lib';
import {
  focusListenerState,
  frameElState,
  frameTypeListState,
} from './frame-recoil';

export function useGetFrameEl(): (
  frameId: string
) => Promise<HTMLElement | null> {
  return useGetRecoilValueFamily(frameElState);
}

export function useGetFrameTypeList(): (
  frameId: string
) => Promise<Set<string>> {
  return useGetRecoilValueFamily(frameTypeListState);
}

export function useSetFrameType(): (
  frameId: string,
  frameType: string,
  addOrDelete: boolean
) => Promise<void> {
  return useRecoilCallback(
    ({ set }) =>
      async (frameId, frameType, addOrDelete) =>
        set(
          frameTypeListState(frameId),
          createFrameTypeListSetter(frameType, addOrDelete)
        ),
    []
  );
}

export function useFocusFrame(): (frameId: string) => Promise<void> {
  const getFrameEl = useGetFrameEl();
  return useCallback(
    async (frameId) => {
      const frameEl = await getFrameEl(frameId);
      frameEl?.focus({ preventScroll: true });
    },
    [getFrameEl]
  );
}

export function useHandleClick(frameId: string): () => void {
  const focusFrame = useFocusFrame();
  return useCallback(() => {
    focusFrame(frameId);
  }, [focusFrame, frameId]);
}

export function useHandleFocus(
  frameId: string
): (e: FocusEvent<HTMLDivElement>) => Promise<void> {
  const setFocusedFrameId = useSetRecoilState(focusedFrameIdState);
  const getFocusedFrameId = useGetFocusedFrameId();
  const getFocusListener = useGetRecoilValueFamily(focusListenerState);
  return useCallback(
    async (e) => {
      const focusedFrameId = await getFocusedFrameId();
      if (frameId !== focusedFrameId) {
        setFocusedFrameId(frameId);
        const focusListener = await getFocusListener(frameId);
        focusListener?.(e);
      }
    },
    [frameId, getFocusListener, getFocusedFrameId, setFocusedFrameId]
  );
}

export function useAdjustScrollPosition(): (
  frameId: string,
  el: INullableElement
) => Promise<void> {
  const getFrameEl = useGetFrameEl();
  return useCallback(
    async (frameId, el) => {
      const frameEl = await getFrameEl(frameId);
      scrollIntoView(el, frameEl);
    },
    [getFrameEl]
  );
}

export function useInitializationEffect(
  frameId: string,
  frameElRef: RefObject<HTMLDivElement>
): void {
  const setFrameEl = useSetRecoilState(frameElState(frameId));
  useEffect(() => {
    setFrameEl(frameElRef.current);
  }, [frameElRef, setFrameEl]);
}

export function useFrameFocusEffect(
  frameElRef: RefObject<HTMLDivElement>,
  focus: boolean
): void {
  useEffect(() => {
    if (focus) {
      frameElRef.current?.focus({ preventScroll: true });
    }
  }, [focus, frameElRef]);
}
