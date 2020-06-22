import d3 from 'd3'
import chroma from 'chroma-js'

import {TintedWheel} from './wheel.js'
import {markerDistance} from './util.js'

export class TintedPalette {
  constructor(colorWheel) {
    this.classNames = {
      palette: colorWheel.cx('palette'),
      paletteColor: colorWheel.cx('palette__color'),
      swatch: colorWheel.cx('palette__color__swatch'),
      slider: colorWheel.cx('palette__color__slider'),
      colorText: colorWheel.cx('palette__color__color-text'),
    }

    this.init(colorWheel)
  }

  init(colorWheel) {
    // Create root palette element
    let $palette = colorWheel.container
      .append('div')
      .attr('class', this.classNames.palette)

    colorWheel.dispatch.on('bindData.themeBuild', data =>
      this.createDOM(colorWheel, data, $palette),
    )
    colorWheel.dispatch.on('markersUpdated.theme', () =>
      this.handleMarkersUpdated(colorWheel, $palette),
    )
  }

  createDOM(colorWheel, data, $palette) {
    let paletteColors = $palette
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

    paletteColors.exit().remove()
  }

  handleMarkersUpdated(colorWheel, $palette) {
    $palette
      .selectAll('.' + this.classNames.paletteColor)
      .each(function (d, i) {
        let swatchEl = this
        switch (colorWheel.currentMode) {
          case TintedWheel.MODES.TRIAD:
            let order = i % 3
            swatchEl.style.order = order
            swatchEl.style.webkitOrder = order
            break
          default:
            let distance = markerDistance(i)
            swatchEl.style.order = distance
            swatchEl.style.webkitOrder = distance
            break
        }
      })

    $palette.selectAll('.' + this.classNames.swatch).each(function (d) {
      let swatchEl = this
      swatchEl.style.backgroundColor = chroma(d.color).hex()
    })

    $palette.selectAll('.' + this.classNames.slider).each(function (d) {
      let sliderEl = this
      let val = parseInt(d.color.v * 100)
      sliderEl.value = val
      d3.select(sliderEl).attr('value', val)
    })

    $palette.selectAll('.' + this.classNames.colorText).each(function (d) {
      let textInputEl = this
      textInputEl.value = chroma(d.color).hex()
    })
  }
}
