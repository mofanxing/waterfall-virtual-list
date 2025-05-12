export interface SuperVirtualListConfig {
    el: HTMLElement | string;
    column: number;
    gap: number;
    viewportHeight: number;
    renderItem: (item: any) => HTMLElement;
    data: any[];
    buffer: number
    maxDomPoolSize?: number;
}