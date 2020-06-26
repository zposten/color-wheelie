import d3 from 'd3'
import chroma from 'chroma-js'

import {colorModes} from './wheel.js'
import {markerDistance} from './util.js'

export class TintedPalette {
  static DEFAULT_OPTIONS = {
    container: document.body,
    baseClassName: 'tinted',
  }

  constructor(options) {
    this.options = {
      ...TintedPalette.DEFAULT_OPTIONS,
      ...options,
    }

    this.classNames = {
      palette: this.cx('palette'),
      paletteColor: this.cx('palette__color'),
      swatch: this.cx('palette__color__swatch'),
      slider: this.cx('palette__color__slider'),
      colorText: this.cx('palette__color__color-text'),
    }

    this.colorWheel = this.options.colorWheel
    this.$container = d3.select(this.options.container)

    // Ensure the container has the correct class
    this.$container.attr('class', this.classNames.palette)
  }

  render(data) {
    let colorWheel = this.colorWheel
    let paletteColors = this.$container
      .selectAll('.' + this.classNames.paletteColor)
      .data(data)

    let newPaletteColors = paletteColors
      .enter()
      .append('div')
      .attr('class', this.classNames.paletteColor)

    // Add color swatches
    newPaletteColors.append('div').attr('class', this.classNames.swatch)

    // Add sliders
    newPaletteColors
      .append('input')
      .attr('type', 'range')
      .attr('class', this.classNames.slider)
      .on('input', function (d) {
        let sliderEl = this
        d.color.v = parseInt(sliderEl.value) / 100
        colorWheel.dispatch.markersUpdated()
      })
      .on('change', () => colorWheel.dispatch.updateEnd())

    // Add textual color hex codes
    newPaletteColors
      .append('input')
      .attr('type', 'text')
      .attr('class', this.classNames.colorText)
      .on('focus', function () {
        let valueEl = this
        // Like jQuery's .one(), attach a listener that only executes once.
        // This way the user can use the cursor normally after the initial selection.
        d3.select(valueEl).on('mouseup', function () {
          d3.event.preventDefault()
          // Detach the listener
          d3.select(valueEl).on('mouseup', null)
        })
        valueEl.select()
      })

    // Remove color swatches that no longer correspond to a datum
    paletteColors.exit().remove()
  }

  onColorValuesChanged() {
    let currentMode = this.colorWheel.currentMode
    this.$container
      .selectAll('.' + this.classNames.paletteColor)
      .each(function (d, i) {
        let swatchEl = this
        let order = currentMode === colorModes.TRIAD ? i % 3 : markerDistance(i)
        swatchEl.style.order = order
        swatchEl.style.webkitOrder = order
      })

    this.$container
      .selectAll('.' + this.classNames.swatch)
      .style('background-color', d => chroma(d.color).hex())

    this.$container
      .selectAll('.' + this.classNames.slider)
      .attr('value', d => parseInt(d.color.v * 100))

    this.$container
      .selectAll('.' + this.classNames.colorText)
      .attr('value', d => chroma(d.color).hex())
  }

  cx(className) {
    return this.options.baseClassName + '-' + className
  }
}
