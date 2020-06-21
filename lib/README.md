# Tinted

Tinted is a reconstruction of [Adobe's color wheel](http://color.adobe.com), built for the browser using [D3.js](https://github.com/mbostock/d3).

## Demo

http://benknight.github.io/kuler-d3/

## Install

```bash
# Install with yarn
yarn add tinted

# Or install with NPM
npm i tinted
```

## Usage

```html
<div id="tinted"></div>
```

```scss
@use 'tinted/colorWheel';
@use 'tinted/colorPalette';

#tinted {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  width: 400px;
}
```

> To make these `@use` statements work, you will need to add `node_modules` to SASS' `--load-path` or sass-loader's `includePaths`.

> If you're not using SASS in your project, we do provide compiled CSS files in the `dist` folder.

```js
import {ColorWheel, ColorPalette} from 'tinted'

let wheel = new ColorWheel({container: '#tinted'})
let palette = new ColorPalette(wheel)

wheel.bindData()
```

## Custom Colors

You can initialize Tinted with a custom color set:

```js
let colors = [
  'red',
  '#0ff',
  {r: 0, g: 255, b: 0},
  {h: 220, s: 1, v: 1},
  {h: 300, s: 1, l: 0.5},
  'hsl(0, 100%, 50%)',
]

let wheel = new ColorWheel({container: '#tinted'})
wheel.bindData(colors)
```
