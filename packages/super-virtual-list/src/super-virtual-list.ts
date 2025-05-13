import { SuperVirtualListConfig, DataItem } from "./types";
import { _getVisibleRange, observeVisibility, debounce, throttle } from "@virtual/shared";
export function SuperVirtual(config: SuperVirtualListConfig) {
  return new SuperVirtualList(config);
}

class SuperVirtualList {
  el: HTMLElement;
  content: HTMLElement | null;
  config: SuperVirtualListConfig;
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

  constructor(config: SuperVirtualListConfig) {
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
  async _initData(config: SuperVirtualListConfig) {
    if (typeof config.data === "function") {
      this.data = await config.data();
    } else {
      this.data = config.data;
    }
    this._onScrollThrottled = throttle(this._onScroll.bind(this), 100);

    this._init_el();
    this._debouncedRecalculate = debounce(this._init.bind(this), 200);
    this.el.addEventListener("scroll", this._onScrollThrottled);
    this.resizeObserver = new ResizeObserver(() =>
      this._debouncedRecalculate()
    );
    this.resizeObserver.observe(this.el);
  }
  _init_el() {
    this.el.style.cssText = `overflow-y: scroll;height: ${this.viewportHeight}px;`;
    let content = document.createElement("div");
    content.className = "content";
    content.style.cssText = "position: relative;width: 100%;";
    this.el.appendChild(content);
    this.content = content;
  }
  async _init() {
    this.colHeights = Array(this.config.column).fill(0);
    this.totalHeight = 0;
    let data = this.data;
    let { renderItem, gap, column } = this.config;
    let width = Math.floor(
      (this.el.clientWidth - (column - 1) * gap) / this.config.column
    );
    this.colWidth = width;
    for (let i = 0; i < data.length; i++) {
      const el = renderItem(data[i]);
      el.style.width = width + "px";
      const measuredHeight = await this._measure(el);
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
  }

  async updateData(data: any[]) {
    let { renderItem, gap } = this.config;
    let width = this.colWidth;
    for (let i = 0; i < data.length; i++) {
      const el = renderItem(data[i]);
      el.style.width = width + "px";
      const measuredHeight = await this._measure(el);
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
  }

  async _measure(el) {
    const measurer = document.createElement("div");
    measurer.style.cssText =
      "position:absolute;visibility:hidden;pointer-events:none;";
    measurer.appendChild(el);
    document.body.appendChild(measurer);

    const imgs = el.querySelectorAll("img");
    if (imgs.length > 0) {
      await Promise.all(
        [...imgs].map(
          (img) =>
            new Promise((resolve) => {
              img.onload = img.onerror = resolve;
            })
        )
      );
    }
    const height = Math.floor(el.offsetHeight);
    document.body.removeChild(measurer);
    return height;
  }

  _setElementStyle(el: HTMLElement, { x, y, width }: any) {
    el.style.width = width + "px";
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  _onScroll() {
    const scrollTop = this.el.scrollTop;
    const buffer = this.config.buffer || 300;
    const [start, end] = _getVisibleRange(
      scrollTop,
      this.viewportHeight,
      buffer,
      this.data,
      this.config.column
    );
    // 移除不在范围内的元素
    for (let [i, el] of this.activeMap.entries()) {
      if (i < start || i > end) {
        this.content.removeChild(el);
        this.activeMap.delete(i);
      }
    }

    // 批量创建 fragment
    const fragment = document.createDocumentFragment();
    if (!this._pendingObservers) this._pendingObservers = [];
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
  async isScrollBottom() {
    const el = this.el;
    const buffer = 50;
    const isBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - buffer;
    if (isBottom && !this.isUpdate && this.config.scrollToBottom) {
      this.isUpdate = true;
      try {
        let data = await this.config.scrollToBottom();
        if (data.length) {
          await this.updateData(data);
        }
      } finally {
        this.isUpdate = false;
      }
    }
  }
}
