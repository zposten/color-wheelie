# Tinted

> Reconstruction of the color wheel UI found on http://color.adobe.com (formerly known as Kuler) using [D3.js](https://github.com/mbostock/d3).

## Demo

http://benknight.github.io/kuler-d3/

## Install

```bash
# Install with yarn
yarn add tinted

# Or install with NPM
npm install tinted
```

## Usage

```html
<div class="color-wheel"></div>
```

By specifying a number of colors:

```js
let colorWheel = new ColorWheel({container: '.color-wheel'})
colorWheel.bindData(5)
```

or, with preexisting color values:

```js
// Use any valid chroma-js input
let colors = [
  'red',
  '#0ff',
  {r: 0, g: 255, b: 0},
  {h: 220, s: 1, v: 1},
  {h: 300, s: 1, l: 0.5},
  'hsl(0, 100%, 50%)',
]

let colorWheel = new ColorWheel({container: '.color-wheel'})
colorWheel.bindData(colors)
```
