interface WaterfallVirtualListConfig {
    el: HTMLElement | string;
    column: number;
    gap: number;
    viewportHeight: number;
    animeClass?: string;
    renderItem: (item: any) => HTMLElement;
    updateData: (data: any[]) => void;
    scrollToBottom: () => any[];
    data: DataItem[] | (() => Promise<DataItem[]>);
    buffer: number;
    maxDomPoolSize?: number;
}
type DataItem = {
    height?: number;
    x?: number;
    y?: number;
    width?: number;
    [key: string]: any;
};

export declare function WaterfallVirtual(config: WaterfallVirtualListConfig): WaterfallVirtualList;
declare class WaterfallVirtualList {
    el: HTMLElement;
    content: HTMLElement | null;
    config: WaterfallVirtualListConfig;
    data: DataItem[];
    colWidth: number;
    colHeights: number[];
    totalHeight: number;
    activeMap: Map<number, HTMLElement>;
    domPool: Map<number, HTMLElement>;
    viewportHeight: number;
    _ticking: boolean;
    _pendingObservers: HTMLElement[];
    _observerTimer: any;
    MAX_DOM_POOL_SIZE: number;
    resizeObserver: ResizeObserver;
    _debouncedRecalculate: () => void;
    isUpdate: boolean;
    _onScrollThrottled: () => void;
    constructor(config: WaterfallVirtualListConfig);
    _initData(config: WaterfallVirtualListConfig): Promise<void>;
    _init_el(): void;
    _init(): Promise<void>;
    updateData(data: any[]): Promise<void>;
    _measure(el: any): Promise<number>;
    _setElementStyle(el: HTMLElement, { x, y, width }: any): void;
    _onScroll(): void;
    isScrollBottom(): Promise<void>;
}

export { WaterfallVirtual as default };
