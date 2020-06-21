import {ColorWheel, colorModes, createColorPalette} from 'color-wheelie'

let colorWheel = new ColorWheel({
  colorWheelImage: './wheel.png',
})

createModeToggle(colorWheel)
createColorPalette(colorWheel)

colorWheel.bindData(5)

function createModeToggle(colorWheel) {
  let modeToggle = colorWheel.container
    .append('select')
    .attr('class', colorWheel.cx('mode-toggle'))
    .on('change', function () {
      colorWheel.currentMode = this.value
      colorWheel.setHarmony()
    })

  for (let mode in colorModes) {
    modeToggle
      .append('option')
      .text(colorModes[mode])
      .attr('selected', () =>
        colorModes[mode] == colorWheel.currentMode ? 'selected' : null,
      )
  }
}
