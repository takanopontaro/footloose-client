import { DIRECTORY_ID_LIST } from './directory-lib';
import { IItemData as IItemSelectorItemData } from './item-selector-typings';
import { Settings } from './settings';

type IVirtualDirectory = {
  actual: string;
  virtual: string;
};

class VirtualDirectoriesClass {
  key = 'virtualDirectories';
  list: IVirtualDirectory[] = [];
  readFlags = this.buildReadFlags();

  constructor() {
    if (Settings.persistent) {
      this.list = Settings.read(this.key, []);
    }
  }

  buildReadFlags(): Record<string, boolean> {
    return DIRECTORY_ID_LIST.reduce<Record<string, boolean>>((flags, id) => {
      flags[id] = false;
      return flags;
    }, {});
  }

  register(actual: string, virtual: string): void {
    this.list.push({ actual, virtual });
    this.save();
  }

  get(path: string): IVirtualDirectory | undefined {
    return this.list.find((item) => path.startsWith(item.actual));
  }

  includes(path: string): boolean {
    return this.get(path) !== undefined;
  }

  convert(path: string): string {
    const vd = this.get(path);
    return vd ? path.replace(vd.actual, vd.virtual) : path;
  }

  parent(parentPath: string, path: string): string {
    const vd = this.list.find((item) => item.actual === path);
    return vd ? vd.virtual.replace(/[/\\][^/\\]+$/, '') : parentPath;
  }

  createDataSet(paths: string[]): IItemSelectorItemData[] {
    return [...paths].reverse().map((path, i) => {
      const data: IItemSelectorItemData = { id: String(i), value: path };
      const vd = this.get(path);
      if (vd) {
        data.label = path.replace(vd.actual, vd.virtual);
      }
      return data;
    });
  }

  serialize(): IVirtualDirectory[] {
    return this.list;
  }

  save(): void {
    Settings.save(this.key, this.serialize());
  }

  clear(): void {
    this.list = [];
  }

  markAsRead(frameId: string): void {
    this.readFlags[frameId] = true;
    const unreadExists = Object.values(this.readFlags).includes(false);
    if (!unreadExists) {
      this.clear();
    }
  }
}

const VirtualDirectories = new VirtualDirectoriesClass();

export { VirtualDirectories };
