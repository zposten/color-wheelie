import {ColorWheel, ColorPalette} from 'tinted'

let colorWheel = new ColorWheel({
  colorWheelImage: './wheel.png',
})

new ColorPalette(colorWheel)
createModeToggle(colorWheel)
colorWheel.bindData(5)

function createModeToggle(colorWheel) {
  let modeToggle = colorWheel.container
    .append('select')
    .attr('class', colorWheel.cx('mode-toggle'))
    .on('change', function () {
      colorWheel.currentMode = this.value
      colorWheel.setHarmony()
    })

  for (let mode in ColorWheel.MODES) {
    modeToggle
      .append('option')
      .text(ColorWheel.MODES[mode])
      .attr('selected', () => (colorWheel.isInMode(mode) ? 'selected' : null))
  }
}
