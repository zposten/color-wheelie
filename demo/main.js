import {TintedWheel, TintedPalette} from 'tinted'

let colorWheel = new TintedWheel({
  colorWheelImage: './wheel.png',
  container: '.tinted',
})

new TintedPalette(colorWheel)
createModeToggle(colorWheel)

colorWheel.bindData()

function createModeToggle(colorWheel) {
  let modeToggle = colorWheel.container
    .append('select')
    .attr('class', 'color-mode-toggle')
    .on('change', function () {
      colorWheel.currentMode = this.value
      colorWheel.setHarmony()
    })

  for (let mode in TintedWheel.MODES) {
    modeToggle
      .append('option')
      .text(TintedWheel.MODES[mode])
      .attr('selected', () => (colorWheel.isInMode(mode) ? 'selected' : null))
  }
}
