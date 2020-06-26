# Tinted

Tinted is a color harmony wheel. It helps you choose color combinations that create pleasing contrasts and feel harmonious.

[Demo](https://zposten.github.io/tinted)

## Install

```bash
# Install with yarn
yarn add tinted

# Or install with NPM
npm i tinted
```

## Usage

```html
<div class="my-color-wheel">
  <svg class="tinted-wheel"></svg>
  <div class="tinted-palette"></div>
</div>
```

```scss
@use 'tinted/wheel';
@use 'tinted/palette';

.my-color-wheel {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: auto;
  max-width: 400px;
}
```

```js
import {TintedWheel, TintedPalette} from 'tinted'

let colorWheel = new TintedWheel({
  container: document.querySelector('.tinted-wheel'),
  colorWheelImage: './wheel.png',
})

let palette = new TintedPalette({
  container: document.querySelector('.tinted-palette'),
  colorWheel: colorWheel,
})

colorWheel.dispatch.on('bindData.main', data => palette.render(data))
colorWheel.dispatch.on('markersUpdated.main', () => {
  palette.onColorValuesChanged()
})

colorWheel.bindData()
```

A few things to note:

- The wheel can be used without the palette, but it is recommended to use them together.
- To make these abbreviated `@use` statements work, you will need to add `node_modules` to SASS' `--load-path` or sass-loader's `includePaths`. Alternatively, you could just path into `node_modules` explicitly.
- If you're not using SASS in your project, we do provide compiled CSS files in the `dist` folder.

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

let wheel = new TintedWheel(options)
wheel.bindData(colors)
```

## Components

### TintedWheel

The color harmony wheel for the user to make a selection of colors.

#### Options

| Name                 | Description                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `container`          | A DOM node or CSS selector for the `<svg>` element that the wheel should be created inside of                            |
| `colorWheelImage`    | A URI to a color HSV color wheel image to use                                                                            |
| `radius`             | The radius of the wheel in SVG coordinate units                                                                          |
| `markerWidth`        | The diameter of the markers used to select colors on the wheel in SVG coordinate units                                   |
| `markerOutlineWidth` | The width of the outline of the color marker in SVG coordinate units                                                     |
| `margin`             | The distance between the border of the `<svg>` and the circle of the wheel in SVG coordinate units                       |
| `initRoot`           | The color that should initially be used to select other harmony colors                                                   |
| `initMode`           | The initial mode the color wheel is in                                                                                   |
| `baseClassName`      | The prefix for the class names for all generated elements. Overriding this will cause all provided CSS to no longer work |

#### Methods

| Name                      | Description                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bindData(userData)`      | It is mandatory to invoke this method. Pass in either an array of color-like values, or the number of colors to initially display. Default to 5 colors |
| `setMode(mode)`           | Set the mode of the wheel. Must be a value from the exported `colorModes` object                                                                       |
| `setHarmony()`            | Based on the current root marker and the current mode, set the values of the other markers to be in harmony                                            |
| `isInMode(mode): boolean` | Returns true if the wheel is in that mode                                                                                                              |

### TintedPalette

A palette of colors to display the user's chosen values from the `TintedWheel`. For each color it:

- Allows the user to change the value (or brightness -- "V" in the HSV color model) of the color
- Displays the hex string value of the color

#### Options

| Name            | Description                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `container`     | A DOM node or CSS selector for the element that the palette should be created inside of                                  |
| `colorWheel`    | The `TintedColorWheel` object to base the palette off of                                                                 |
| `baseClassName` | The prefix for the class names for all generated elements. Overriding this will cause all provided CSS to no longer work |

#### Methods

| Name                     | Description                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| `constructor(options)`   | Constructor                                                                                            |
| `render(data)`           | Create or update the number of colors in the palette based on data from the wheel                      |
| `onColorValuesChanged()` | Update the color values for the existing number of colors, passing in the current mode the wheel is in |

## Styling

Feel free to override any of the default styling as you please.

Out of the box, tinted supports a color scheme for a light and dark background, defaulting to the light background. To change it to expect a dark background, add a `tinted--dark` class to a parent element of the wheel and/or palette.
