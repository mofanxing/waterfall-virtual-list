/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function _getVisibleRange(scrollTop, viewportHeight, buffer = 100, data = [], overscanCount = 0) {
    const visibleTop = scrollTop - buffer;
    const visibleBottom = scrollTop + viewportHeight + buffer;
    const start = _binarySearch(visibleTop, data);
    const end = _binarySearch(visibleBottom, data);
    return [
        Math.max(0, start - overscanCount),
        Math.min(data.length - 1, end + overscanCount),
    ];
}
function _binarySearch(targetY, data) {
    let low = 0, high = data.length - 1;
    let result = data.length;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (data[mid].y >= targetY) {
            result = mid;
            high = mid - 1;
        }
        else {
            low = mid + 1;
        }
    }
    return result;
}
function observeVisibility(el, animeClass) {
    const observer = new IntersectionObserver(([entry], obs) => {
        if (entry.isIntersecting) {
            //给第一个子元素添加动画
            if (el.firstElementChild) {
                el.firstElementChild.classList.add(animeClass);
            }
            obs.unobserve(el);
        }
        else {
            if (el.firstElementChild) {
                el.firstElementChild.classList.remove(animeClass);
            }
        }
    }, {
        root: this.el, // 设置为滚动容器
        threshold: 0.1, // 有 10% 可见就触发
    });
    observer.observe(el);
}
/**
 * 创建一个防抖函数，该函数在指定的延迟时间内没有再次调用时，才会执行原始函数。
 * @param func - 要进行防抖处理的函数。
 * @param delay - 延迟时间，单位为毫秒。
 * @returns 防抖后的函数。
 */
function debounce(func, delay, immediate = false) {
    let timer = null;
    let hasCalled = false;
    return function (...args) {
        const context = this;
        // 如果需要立即执行且还没有执行过
        if (immediate && !timer && !hasCalled) {
            func.apply(context, args);
            hasCalled = true;
        }
        if (timer !== null) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            if (!immediate) {
                func.apply(context, args);
            }
            timer = null;
            hasCalled = false; // 重置，允许下一次立即执行
        }, delay);
    };
}
function throttle(func, wait, options = {}) {
    let timeout = null;
    let previous = 0;
    let context;
    let args;
    const later = () => {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        func.apply(context, args);
        context = args = null;
    };
    const throttled = function (...rest) {
        const now = Date.now();
        if (!previous && options.leading === false)
            previous = now;
        const remaining = wait - (now - previous);
        context = this;
        args = rest;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            func.apply(context, args);
            context = args = null;
        }
        else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
    };
    throttled.cancel = () => {
        clearTimeout(timeout);
        timeout = null;
        previous = 0;
    };
    return throttled;
}

function WaterfallVirtual(config) {
    return new WaterfallVirtualList(config);
}
class WaterfallVirtualList {
    constructor(config) {
        this.config = config;
        this.el =
            typeof config.el === "string"
                ? document.querySelector(config.el)
                : config.el;
        this.colHeights = Array(config.column).fill(0);
        this.totalHeight = 0;
        this.colWidth = 0;
        this.content = null;
        this.activeMap = new Map(); // 渲染中的 DOM
        this.domPool = new Map();
        this.viewportHeight = this.config.viewportHeight;
        this.MAX_DOM_POOL_SIZE = this.config.maxDomPoolSize || 300;
        this._pendingObservers = [];
        this._observerTimer = null;
        this._ticking = false;
        this.isUpdate = false;
        this._initData(config);
    }
    //初始化data
    _initData(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof config.data === "function") {
                this.data = yield config.data();
            }
            else {
                this.data = config.data;
            }
            this._onScrollThrottled = throttle(this._onScroll.bind(this), 100);
            this._init_el();
            this._debouncedRecalculate = debounce(this._init.bind(this), 200);
            this.el.addEventListener("scroll", this._onScrollThrottled);
            this.resizeObserver = new ResizeObserver(() => this._debouncedRecalculate());
            this.resizeObserver.observe(this.el);
        });
    }
    _init_el() {
        this.el.style.cssText = `overflow-y: scroll;height: ${this.viewportHeight}px;`;
        let content = document.createElement("div");
        content.className = "content";
        content.style.cssText = "position: relative;width: 100%;";
        this.el.appendChild(content);
        this.content = content;
    }
    _init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.colHeights = Array(this.config.column).fill(0);
            this.totalHeight = 0;
            let data = this.data;
            let { renderItem, gap, column } = this.config;
            let width = Math.floor((this.el.clientWidth - (column - 1) * gap) / this.config.column);
            this.colWidth = width;
            for (let i = 0; i < data.length; i++) {
                const el = renderItem(data[i]);
                el.style.width = width + "px";
                const measuredHeight = yield this._measure(el);
                const minCol = this.colHeights.indexOf(Math.min(...this.colHeights));
                const x = Math.floor(minCol * (width + gap));
                const y = Math.floor(this.colHeights[minCol]);
                data[i].height = measuredHeight;
                data[i].x = x;
                data[i].y = y;
                data[i].width = width;
                this.colHeights[minCol] += measuredHeight + gap;
                // 4. 立即更新当前可见的DOM元素
                const activeEl = this.activeMap.get(i);
                if (activeEl) {
                    activeEl.style.width = `${this.colWidth}px`;
                    activeEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                }
            }
            this.data = data;
            this.totalHeight = Math.max(...this.colHeights);
            this.content.style.height = this.totalHeight + "px";
            requestAnimationFrame(() => {
                this._onScroll();
            });
        });
    }
    updateData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let { renderItem, gap } = this.config;
            let width = this.colWidth;
            for (let i = 0; i < data.length; i++) {
                const el = renderItem(data[i]);
                el.style.width = width + "px";
                const measuredHeight = yield this._measure(el);
                const minCol = this.colHeights.indexOf(Math.min(...this.colHeights));
                const x = Math.floor(minCol * (width + gap));
                const y = Math.floor(this.colHeights[minCol]);
                data[i].height = measuredHeight;
                data[i].x = x;
                data[i].y = y;
                data[i].width = width;
                this.colHeights[minCol] += measuredHeight + gap;
            }
            this.data.push(...data);
            this.totalHeight = Math.max(...this.colHeights);
            this.content.style.height = this.totalHeight + "px";
            requestAnimationFrame(() => {
                this._onScroll();
            });
        });
    }
    _measure(el) {
        return __awaiter(this, void 0, void 0, function* () {
            const measurer = document.createElement("div");
            measurer.style.cssText =
                "position:absolute;visibility:hidden;pointer-events:none;";
            measurer.appendChild(el);
            document.body.appendChild(measurer);
            const imgs = el.querySelectorAll("img");
            if (imgs.length > 0) {
                yield Promise.all([...imgs].map((img) => new Promise((resolve) => {
                    img.onload = img.onerror = resolve;
                })));
            }
            const height = Math.floor(el.offsetHeight);
            document.body.removeChild(measurer);
            return height;
        });
    }
    _setElementStyle(el, { x, y, width }) {
        el.style.width = width + "px";
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
    _onScroll() {
        const scrollTop = this.el.scrollTop;
        const buffer = this.config.buffer || 300;
        const [start, end] = _getVisibleRange(scrollTop, this.viewportHeight, buffer, this.data, this.config.column);
        // 移除不在范围内的元素
        for (let [i, el] of this.activeMap.entries()) {
            if (i < start || i > end) {
                this.content.removeChild(el);
                this.activeMap.delete(i);
            }
        }
        // 批量创建 fragment
        const fragment = document.createDocumentFragment();
        if (!this._pendingObservers)
            this._pendingObservers = [];
        // 添加可见元素
        for (let i = start; i <= end; i++) {
            if (!this.activeMap.has(i)) {
                let el = this.domPool.get(i);
                if (!el) {
                    el = this.config.renderItem(this.data[i]);
                    this.domPool.set(i, el);
                }
                const pos = this.data[i];
                el.style.position = "absolute";
                this._setElementStyle(el, { width: pos.width, x: pos.x, y: pos.y });
                this.activeMap.set(i, el);
                fragment.appendChild(el);
                this._pendingObservers.push(el);
            }
        }
        this.content.appendChild(fragment);
        // 延迟处理观察动画
        cancelAnimationFrame(this._observerTimer);
        this._observerTimer = requestAnimationFrame(() => {
            this._pendingObservers.forEach((el) => observeVisibility.call(this, el, this.config.animeClass));
            this._pendingObservers = [];
        });
        // 清理 domPool（避免无限增长）
        if (this.domPool.size > this.MAX_DOM_POOL_SIZE) {
            const keys = [...this.domPool.keys()];
            for (let i = 0; i < keys.length - this.MAX_DOM_POOL_SIZE; i++) {
                const index = keys[i];
                if (!this.activeMap.has(index)) {
                    this.domPool.delete(index);
                }
            }
        }
        // 检查是否滚动到底部
        this.isScrollBottom();
    }
    //判断是否滚动到底部
    isScrollBottom() {
        return __awaiter(this, void 0, void 0, function* () {
            const el = this.el;
            const buffer = 50;
            const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - buffer;
            if (isBottom && !this.isUpdate && this.config.scrollToBottom) {
                this.isUpdate = true;
                try {
                    let data = yield this.config.scrollToBottom();
                    if (data.length) {
                        yield this.updateData(data);
                    }
                }
                finally {
                    this.isUpdate = false;
                }
            }
        });
    }
}

export { WaterfallVirtual as default };
