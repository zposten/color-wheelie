import d3 from 'd3'
import chroma from 'chroma-js'

import { colorModes } from './colorWheel.js'
import { markerDistance } from './util.js'

export function createColorDisplay(colorWheel) {
  let theme = colorWheel.container
    .append('div')
    .attr('class', colorWheel.cx('theme'))

  colorWheel.dispatch.on('bindData.themeBuild', function (data) {
    let swatches = theme
      .selectAll(colorWheel.selector('theme-swatch'))
      .data(data)
    let newSwatches = swatches
      .enter()
      .append('div')
      .attr('class', colorWheel.cx('theme-swatch'))

    // Add color
    newSwatches.append('div').attr('class', colorWheel.cx('theme-color'))

    // Add sliders
    newSwatches
      .append('input')
      .attr('type', 'range')
      .attr('class', colorWheel.cx('theme-slider'))
      .on('input', function (d) {
        let sliderEl = this
        d.color.v = parseInt(sliderEl.value) / 100
        colorWheel.dispatch.markersUpdated()
      })
      .on('change', function () {
        colorWheel.dispatch.updateEnd()
      })

    // Add color codes
    newSwatches
      .append('input')
      .attr('type', 'text')
      .attr('class', colorWheel.cx('theme-value'))
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

    swatches.exit().remove()
  })

  colorWheel.dispatch.on('markersUpdated.theme', function () {
    colorWheel.container
      .selectAll(colorWheel.selector('theme-swatch'))
      .each(function (d, i) {
        let swatchEl = this
        switch (colorWheel.currentMode) {
          case colorModes.TRIAD:
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

    colorWheel.container
      .selectAll(colorWheel.selector('theme-color'))
      .each(function (d) {
        let colorEl = this

        // TODO CHECK
        colorEl.style.backgroundColor = chroma(d.color).hex()
      })

    colorWheel.container
      .selectAll(colorWheel.selector('theme-slider'))
      .each(function (d) {
        let sliderEl = this
        let val = parseInt(d.color.v * 100)
        sliderEl.value = val
        d3.select(sliderEl).attr('value', val)
      })

    colorWheel.container
      .selectAll(colorWheel.selector('theme-value'))
      .each(function (d) {
        let valueEl = this

        // TODO CHECK
        valueEl.value = chroma(d.color).hex()
      })
  })
}
