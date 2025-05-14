export declare function _getVisibleRange(scrollTop: any, viewportHeight: any, buffer?: number, data?: any[], overscanCount?: number): number[];
export declare function observeVisibility(el: HTMLElement, animeClass: string): void;
/**
 * 创建一个防抖函数，该函数在指定的延迟时间内没有再次调用时，才会执行原始函数。
 * @param func - 要进行防抖处理的函数。
 * @param delay - 延迟时间，单位为毫秒。
 * @returns 防抖后的函数。
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, delay: number, immediate?: boolean): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => void>(func: T, wait: number, options?: {
    leading?: boolean;
    trailing?: boolean;
}): T;
