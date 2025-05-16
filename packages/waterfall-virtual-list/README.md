# 🌊 Waterfall Virtual List

A high-performance, virtualized waterfall layout component for large-scale image or card lists.  
Built with **performance-first** principles, using **binary search** to efficiently determine visible ranges and minimal DOM operations.

### 🧠 Features

* ⚡ High-performance virtual list rendering
* 🔍 Binary search to calculate visible range
* ♻️ DOM pooling to reduce garbage collection
* 📦 Supports both ESM and Global builds
* 🤝 SSR-friendly (with proper mounting)
* ⚡ Zero dependencies (except shared utils)
* 💻 ESM + Global build support
* 🌐 Can be used anywhere JavaScript is supported

---

## 📦 Installation

```bash
pnpm add @redlives/waterfall-virtual-list
# or
npm install @redlives/waterfall-virtual-list
````

---

## 📚 Usage

### From CDN or Without a Bundler

- **Global Build:**  
  `dist/waterfall-virtual-list.global.js` – for direct browser use via `<script>`.

- **ESM Build:**  
  `dist/waterfall-virtual-list.esm-bundler.js` – native ES module for modern browsers.


---

### Basic Usage (ESM in Vite/Webpack)

```ts
import WaterfallVirtual from "@redlives/waterfall-virtual-list/dist/waterfall-virtual-list.esm-bundler.js";

const instance = WaterfallVirtual({
  el: "#container", // or HTMLElement
  data: [...]
  column: 3,
  gap: 20,
  viewportHeight: 600,
  renderItem: (item) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<img src="${item.img}" /><p>${item.title}</p>`;
    return div;
  },
  animeClass: "fade-in",
});
```

### Use via CDN

```html
<script src="waterfall-virtual-list.global.js"></script>
<script>
  const instance = WaterfallVirtual({
    el: "#container",
    data: [...], // or a function
    column: 3,
    gap: 10,
    viewportHeight: 600,
    renderItem: (item) => {
      const div = document.createElement("div");
      div.innerHTML = `<img src="${item.img}" />`;
      return div;
    }
  });
</script>
```

---

### Configuration Options

| Option           | Type                           | Description                                                     |
| ---------------- | ------------------------------ | --------------------------------------------------------------- |
| `el`             | `string \| HTMLElement`        | Container element                                               |
| `data`           | `Array \| Promise<DataItem[]>` | Initial dataset or async fetch function                         |
| `column`         | `number`                       | Number of columns                                               |
| `gap`            | `number`                       | Gap between items                                               |
| `viewportHeight` | `number`                       | Height of scrollable container                                  |
| `renderItem`     | `(item) => HTMLElement`        | Render function for each item                                   |
| `scrollToBottom` | `() => Promise<DataItem[]>`    | Optional: fetch more data on scroll bottom                      |
| `animeClass`     | `string`                       | Optional: class to apply visibility animation                   |
| `buffer`         | `number`                       | Optional: additional buffer area before and after visible range |
| `maxDomPoolSize` | `number`                       | Optional: maximum number of elements in DOM reuse pool          |
