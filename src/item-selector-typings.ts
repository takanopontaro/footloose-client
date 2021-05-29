export interface IItemEl extends HTMLButtonElement {
  dataset: {
    active: string;
    index: string;
    value: string;
  };
}

export type IItemData = { id: string; label?: string; value: string };

export type IDeletionListener = (data: string) => void;

export type IProperties = {
  dataSet: IItemData[];
  onDelete?: IDeletionListener;
};
