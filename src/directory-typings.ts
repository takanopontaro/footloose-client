import { IEntry, IEntryType } from 'footloose';

export interface ITrEl extends HTMLTableRowElement {
  dataset: {
    active: string;
    index: string;
    parent: string;
    path: string;
    type: IEntryType;
    mime: string;
  };
}

export interface IThEl extends HTMLTableHeaderCellElement {
  dataset: {
    col: ISortKey;
  };
}

export type ISortKey =
  | 'name'
  | 'ext'
  | 'type'
  | 'mime'
  | 'atime'
  | 'mtime'
  | 'ctime'
  | 'birthtime'
  | 'size';

export type ISortOrder = 'ascending' | 'descending' | 'none';

export type ISort = {
  key: ISortKey;
  order: Exclude<ISortOrder, 'none'>;
};

export type IPreviewMaker = (entry: IEntry) => string;

export type IDirectorySettings = {
  sorts: ISort[];
  filter: string;
  path: string;
  previewMaker: IPreviewMaker;
};
