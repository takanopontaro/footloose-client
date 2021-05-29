import { FC, memo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useKeyboardShortcutsEffect } from './app-hooks';
import { focusedFrameIdState } from './app-recoil';
import {
  useFrameFocusEffect,
  useHandleClick,
  useHandleFocus,
  useInitializationEffect,
} from './frame-hooks';
import { frameTypeListState } from './frame-recoil';

type IProps = {
  active?: boolean;
  id: string;
  type: string;
  children?: React.ReactNode; // for React.memo()
};

const FrameComponent: FC<IProps> = ({ active, children, id, type }) => {
  const focusedFrameId = useRecoilValue(focusedFrameIdState);

  const frameTypeList = useRecoilValue(frameTypeListState(id));

  const frameElRef = useRef<HTMLDivElement>(null);

  const handleClick = useHandleClick(id);

  const handleFocus = useHandleFocus(id);

  useKeyboardShortcutsEffect(type, id, frameElRef);

  useInitializationEffect(id, frameElRef);

  useFrameFocusEffect(frameElRef, focusedFrameId === id);

  const frameType = [...frameTypeList, type].join(' ');

  return (
    <div
      id={id}
      className="frame"
      onClick={handleClick}
      data-active={active ?? focusedFrameId === id}
      data-focus={focusedFrameId === id}
      data-frame={frameType}
    >
      <div
        ref={frameElRef}
        className="frame_outer"
        tabIndex={-1}
        onFocus={handleFocus}
      >
        <div className="frame_inner">{children}</div>
      </div>
    </div>
  );
};

const Frame = memo(FrameComponent);

export { Frame };
