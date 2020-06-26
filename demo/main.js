import {TintedWheel, TintedPalette, colorModes} from 'tinted'

let colorWheel = new TintedWheel({
  container: document.querySelector('.tinted-wheel'),
  colorWheelImage: './wheel.png',
})

let palette = new TintedPalette({
  container: document.querySelector('.tinted-palette'),
  colorWheel,
})

colorWheel.dispatch.on('bindData.main', data => palette.render(data))
colorWheel.dispatch.on('markersUpdated.main', () => {
  palette.onColorValuesChanged()
})

colorWheel.bindData()

createModeToggle(colorWheel)

function createModeToggle(colorWheel) {
  let modeToggle = d3
    .select('body')
    .append('select')
    .attr('class', 'color-mode-toggle')
    .on('change', function () {
      colorWheel.currentMode = this.value
      colorWheel.setHarmony()
    })

  for (let mode in colorModes) {
    modeToggle
      .append('option')
      .text(colorModes[mode])
      .attr('selected', () => (colorWheel.isInMode(mode) ? 'selected' : null))
  }
}
