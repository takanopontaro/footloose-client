import { genUid } from './app-lib';
import { IItemData as IItemSelectorItemData } from './item-selector-typings';
import { Settings } from './settings';

type IBookmarkData = IItemSelectorItemData;

class BookmarkClass {
  key = 'bookmark';
  maxIndex = 1000;
  dataSet: IBookmarkData[] = [];

  constructor() {
    if (Settings.persistent) {
      this.dataSet = Settings.read(this.key, []);
    }
  }

  get length(): number {
    return this.dataSet.length;
  }

  has(path: string): boolean {
    return this.dataSet.some(({ value }) => value === path);
  }

  add(path: string): void {
    if (this.has(path)) {
      return;
    }
    if (this.length >= this.maxIndex) {
      this.delete(0);
    }
    this.dataSet.push({ id: genUid(), label: path, value: path });
    this.save();
  }

  delete(indexOrPath: number | string): void {
    if (typeof indexOrPath === 'number') {
      this.dataSet.splice(indexOrPath, 1);
      this.save();
      return;
    }
    this.dataSet = this.dataSet.filter(({ value }) => value !== indexOrPath);
    this.save();
  }

  serialize(): IBookmarkData[] {
    return this.dataSet;
  }

  save(): void {
    Settings.save(this.key, this.serialize());
  }
}

const Bookmark = new BookmarkClass();

export { Bookmark };
