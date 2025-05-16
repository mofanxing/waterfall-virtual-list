# 🌊 Waterfall Virtual List

A high-performance, virtualized waterfall layout component for large-scale image or card lists.  
Built with **performance-first** principles, using **binary search** to efficiently determine visible ranges and minimal DOM operations.

## 🚀 Features

- 📦 Virtualized rendering for massive datasets
- 🌈 Dynamic item height support
- 🧠 Binary search for efficient visible range calculation
- ♻️ DOM reuse via pooling
- 💥 Resize observer + scroll buffering
- ⚡ Zero dependencies (except shared utils)
- 💻 ESM + Global build support

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
