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

export { _getVisibleRange, debounce, observeVisibility, throttle };
