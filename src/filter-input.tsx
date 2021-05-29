import { FC, memo, useRef } from 'react';
import { RecoilState, useRecoilValue } from 'recoil';
import { useExportsEffect, useKeyboardShortcutsEffect } from './app-hooks';
import {
  useFilterInputExports,
  useHandleBlur,
  useHandleChange,
  useHandleFocus,
  useInitializationEffect,
} from './filter-input-hooks';
import { FILTER_INPUT_KEY, getFilterInputId } from './filter-input-lib';

type IProps = {
  frameId: string;
  filterState: RecoilState<string>;
};

const FilterInputComponent: FC<IProps> = ({ filterState, frameId }) => {
  const filterText = useRecoilValue(filterState);

  const inputElRef = useRef<HTMLInputElement>(null);

  const handleFocus = useHandleFocus(frameId);

  const handleBlur = useHandleBlur();

  const handleChange = useHandleChange(frameId);

  useKeyboardShortcutsEffect(
    FILTER_INPUT_KEY,
    getFilterInputId(frameId),
    inputElRef
  );

  useInitializationEffect(frameId, inputElRef, filterState);

  useExportsEffect(FILTER_INPUT_KEY, useFilterInputExports());

  return (
    <div className="filterInput">
      <input
        ref={inputElRef}
        type="text"
        value={filterText}
        className="mousetrap"
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
      />
    </div>
  );
};

const FilterInput = memo(FilterInputComponent);

export { FilterInput };
