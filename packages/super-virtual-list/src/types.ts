export interface SuperVirtualListConfig {
  el: HTMLElement | string;
  column: number;
  gap: number;
  viewportHeight: number;
  renderItem: (item: any) => HTMLElement;
  updateData: (data: any[]) => void;
  scrollToBottom: () => any[];
  data: DataItem[] | (() => Promise<DataItem[]>);
  buffer: number;
  maxDomPoolSize?: number;
}

export type DataItem = {
  height?: number;
  x?: number;
  y?: number;
  width?: number;
  [key: string]: any;
};
