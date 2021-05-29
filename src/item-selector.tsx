import { FC, memo, useRef } from 'react';
import { useRecoilValue } from 'recoil';
import { useExportsEffect } from './app-hooks';
import { useCancelDialog } from './dialog-hooks';
import { IDialogContentProps } from './dialog-typings';
import { FilterInput } from './filter-input';
import {
  useActiveItemFixEffect,
  useHandleClick,
  useHandleFocus,
  useInitializationEffect,
  useItemSelectorExports,
} from './item-selector-hooks';
import { ITEM_SELECTOR_KEY } from './item-selector-lib';
import { filteredItemsState, itemFilterState } from './item-selector-recoil';

const ItemSelectorComponent: FC<IDialogContentProps> = () => {
  const filteredItems = useRecoilValue(filteredItemsState);

  const itemListElRef = useRef<HTMLDivElement>(null);

  const buttonElRef = useRef<HTMLButtonElement>(null);

  const cancel = useCancelDialog(ITEM_SELECTOR_KEY);

  const handleFocus = useHandleFocus();

  const handleClick = useHandleClick();

  useInitializationEffect(itemListElRef, buttonElRef);

  useExportsEffect(ITEM_SELECTOR_KEY, useItemSelectorExports());

  useActiveItemFixEffect();

  return (
    <div className="itemSelector">
      <div className="itemSelector_head">
        <FilterInput
          frameId={ITEM_SELECTOR_KEY}
          filterState={itemFilterState}
        />
      </div>
      <div ref={itemListElRef} className="itemSelector_body">
        {filteredItems.map((data, i) => (
          <button
            key={data.id}
            type="button"
            className="itemSelector_item"
            onClick={handleClick}
            onFocus={handleFocus}
            data-active="false"
            data-index={i}
            data-value={data.value}
          >
            {data.label ?? data.value}
          </button>
        ))}
      </div>
      <div className="itemSelector_foot">
        <button
          ref={buttonElRef}
          type="button"
          className="dialog_cancel"
          onClick={cancel}
        />
      </div>
    </div>
  );
};

const ItemSelector = memo(ItemSelectorComponent);

export { ItemSelector };
