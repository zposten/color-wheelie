import { ColorWheel, colorModes } from './colorWheel.js'

let colorWheel = new ColorWheel()
bindModeToggle(colorWheel)
colorWheel.bindData(5)

function bindModeToggle(colorWheel) {
  var modeToggle = colorWheel.container
    .append('select')
    .attr('class', colorWheel.cx('mode-toggle'))
    .on('change', function () {
      colorWheel.currentMode = this.value
      colorWheel.setHarmony()
    })

  for (var mode in colorModes) {
    modeToggle
      .append('option')
      .text(colorModes[mode])
      .attr('selected', () =>
        colorModes[mode] == colorWheel.currentMode ? 'selected' : null
      )
  }
}
