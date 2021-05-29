import { atom, selector } from 'recoil';
import { IDeletionListener, IItemData } from './item-selector-typings';

export const itemListElState = atom<HTMLDivElement | null>({
  key: 'itemSelector/itemListEl',
  default: null,
});

export const buttonElState = atom<HTMLButtonElement | null>({
  key: 'itemSelector/buttonEl',
  default: null,
});

export const itemFilterState = atom<string>({
  key: 'itemSelector/itemFilter',
  default: '',
});

export const deletionListenerState = atom<IDeletionListener | null>({
  key: 'itemSelector/deletionListener',
  default: null,
});

export const originalItemsState = atom<IItemData[]>({
  key: 'itemSelector/originalItems',
  default: [],
});

export const filteredItemsState = selector<IItemData[]>({
  key: 'itemSelector/filteredItems',
  get: ({ get }) => {
    const items = get(originalItemsState);
    const filter = get(itemFilterState).trim();
    if (filter === '') {
      return items;
    }
    try {
      const re = new RegExp(filter, 'i');
      return items.filter((item) => re.test(item.label ?? item.value));
    } catch (e) {
      return items;
    }
  },
});
