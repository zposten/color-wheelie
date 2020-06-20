import {
  artisticToScientificSmooth,
  scientificToArtisticSmooth,
  hexFromHS,
  markerDistance,
  stepFn,
  svgToCartesian,
  clampToCircle,
  getSVGPositionFromHS,
  getHSFromSVGPosition,
} from './util.js'

export class ColorWheelMarkerDatum {
  constructor(color, name, show) {
    this.color = tinycolor(color).toHsv()
    this.name = name
    this.show = show
  }
}

// These modes define a relationship between the colors on a
// color wheel, based on "science".
export const colorModes = {
  CUSTOM: 'Custom',
  ANALOGOUS: 'Analogous',
  COMPLEMENTARY: 'Complementary',
  TRIAD: 'Triad',
  TETRAD: 'Tetrad',
  MONOCHROMATIC: 'Monochromatic',
  SHADES: 'Shades',
}

export class ColorWheel {
  static defaultOptions = {
    container: document.body,
    radius: 175,
    margin: 40, // Space around the edge of the wheel
    markerWidth: 40,
    defaultSlice: 20,
    initRoot: 'red',
    initMode: colorModes.ANALOGOUS,
    baseClassName: 'color-wheel',
  }

  constructor(options) {
    this.options = {
      ...ColorWheel.defaultOptions,
      options,
    }

    this.init()
  }

  init() {
    const { initMode, container, defaultSlice } = this.options

    if (!Object.values(colorModes).includes(initMode)) {
      throw Error('Invalid mode specified: ' + mode)
    }

    this.currentMode = initMode
    this.container = d3.select(container)
    this.slice = defaultSlice

    this.createDOM()
    this.bindEvents()
  }

  createDOM() {
    const { radius, baseClassName, margin } = this.options
    let diameter = radius * 2

    this.$ = {}

    this.$.wheel = this.container.append('svg').attr({
      class: baseClassName,
      width: diameter,
      height: diameter,
      viewBox: [
        -1 * margin,
        -1 * margin,
        diameter + 2 * margin,
        diameter + 2 * margin,
      ].join(' '),
    })

    this.$.wheel.append('circle').attr({
      fill: 'black',
      r: radius,
      cx: radius,
      cy: radius,
      transform: 'translate(4, 4)',
    })

    this.$.wheel.append('image').attr({
      width: diameter,
      height: diameter,
      'xlink:href': 'http://benknight.github.io/kuler-d3/wheel.png',
    })

    this.$.markerTrails = this.$.wheel.append('g')
    this.$.markers = this.$.wheel.append('g')
  }

  bindEvents() {
    const { radius } = this.options

    this.dispatch = d3.dispatch(
      // Markers datum has changed, so redraw as necessary, etc.
      'markersUpdated',
      // "updateEnd" means the state of the ColorWheel has been finished updating.
      'updateEnd',
      // Initial data was successfully bound.
      'bindData',
      // The mode was changed
      'modeChanged'
    )

    this.dispatch.on('bindData.default', () => {
      this.setHarmony()
    })

    this.dispatch.on('markersUpdated.default', () => {
      this.getMarkers()
        .attr({
          transform: d => {
            if (isNaN(d.color.h) || isNaN(d.color.s)) return
            let position = getSVGPositionFromHS(d.color.h, d.color.s, radius)
            return `translate(${position.x}, ${position.y})`
          },
          visibility: d => (d.show ? 'visible' : 'hidden'),
        })
        .select('circle')
        .attr({ fill: d => hexFromHS(d.color.h, d.color.s) })

      this.container.selectAll(this.selector('marker-trail')).attr({
        x2: d => {
          if (isNaN(d.color.h) || isNaN(d.color.s)) return
          return getSVGPositionFromHS(d.color.h, d.color.s, radius).x
        },
        y2: d => {
          if (isNaN(d.color.h) || isNaN(d.color.s)) return
          return getSVGPositionFromHS(d.color.h, d.color.s, radius).y
        },
        visibility: d => (d.show ? 'visible' : 'hidden'),
      })
    })

    this.dispatch.on('modeChanged.default', function () {
      self.container.attr('data-mode', self.currentMode)
    })
  }

  bindData(newData) {
    const { initRoot } = this.options
    let data

    // Data can be passed as a whole number,
    // or an array of ColorWheelMarkerDatum.
    if (Array.isArray(newData)) {
      data = newData
      this.setMode(colorModes.CUSTOM)
    } else {
      // We weren't given any data so create our own.
      let numColors = typeof newData === 'number' ? newData : 5
      data = []

      for (let i = 0; i < numColors; ++i) {
        let datum = new ColorWheelMarkerDatum(initRoot, null, true)
        data.push(datum)
      }
    }

    this.createMarkerDOMElements(data)
  }

  createMarkerDOMElements(data) {
    const { radius, markerWidth } = this.options

    let markerTrails = this.$.markerTrails
      .selectAll(this.selector('marker-trail'))
      .data(data)

    markerTrails
      .enter()
      .append('line')
      .attr({
        class: this.cx('marker-trail'),
        x1: radius,
        y1: radius,
        stroke: 'white',
        'stroke-opacity': 0.75,
        'stroke-width': 3,
        'stroke-dasharray': '10, 6',
      })

    markerTrails.exit().remove()

    // Set the data for each marker?
    let markers = this.$.markers.selectAll(this.selector('marker')).data(data)

    markers
      .enter()
      .append('g')
      .attr({
        class: this.cx('marker'),
        visibility: 'visible',
      })
      .append('circle')
      .attr({
        r: markerWidth / 2,
        stroke: 'white',
        'stroke-width': 2,
        'stroke-opacity': 0.9,
        cursor: 'move',
      })

    markers.exit().remove()

    markers
      .append('text')
      .text(d => d.name)
      .attr({
        x: markerWidth / 2 + 8,
        y: markerWidth / 4 - 5,
        fill: 'white',
        'font-size': '13px',
      })

    let dragBehavior = this.getDragBehavior()
    markers.call(dragBehavior)

    this.dispatch.bindData(data)
    this.dispatch.markersUpdated()
    this.dispatch.updateEnd()
  }

  getDragBehavior() {
    const self = this
    return d3.behavior
      .drag()
      .on('drag', function (d) {
        let markerEl = this
        let { radius } = self.options

        let pos = clampToCircle(d3.event.x, d3.event.y, radius)
        let hs = getHSFromSVGPosition(pos.x, pos.y, radius)

        d.color.h = hs.h
        d.color.s = hs.s

        let p = svgToCartesian(d3.event.x, d3.event.y, radius)
        let dragHue = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 720) % 360

        let startingHue = parseFloat(
          d3.select(markerEl).attr('data-startingHue')
        )

        let theta1 = (360 + startingHue - dragHue) % 360
        let theta2 = (360 + dragHue - startingHue) % 360

        self.updateHarmony(this, theta1 < theta2 ? -1 * theta1 : theta2)
      })
      .on('dragstart', () => {
        this.getVisibleMarkers().attr('data-startingHue', d =>
          scientificToArtisticSmooth(d.color.h)
        )
      })
      .on('dragend', () => {
        let visibleMarkers = this.getVisibleMarkers()
        visibleMarkers.attr('data-startingHue', null)

        if (this.currentMode === colorModes.ANALOGOUS) {
          let rootTheta = scientificToArtisticSmooth(
            d3.select(visibleMarkers[0][0]).datum().color.h
          )

          if (visibleMarkers[0].length > 1) {
            let neighborTheta = scientificToArtisticSmooth(
              d3.select(visibleMarkers[0][1]).datum().color.h
            )
            this.slice = (360 + neighborTheta - rootTheta) % 360
          }
        }

        this.dispatch.updateEnd()
      })
  }

  setHarmony() {
    let root = this.getRootMarker()
    let offsetFactor = 0.08
    this.getMarkers().classed('root', false)

    if (root.empty()) return

    let rootHue = scientificToArtisticSmooth(root.datum().color.h)

    switch (this.currentMode) {
      case colorModes.ANALOGOUS:
        root.classed('root', true)
        this.getVisibleMarkers().each((d, index) => {
          let newHue =
            (rootHue + markerDistance(index) * this.slice + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1
          d.color.v = 1
        })
        break
      case colorModes.MONOCHROMATIC:
      case colorModes.SHADES:
        this.getVisibleMarkers().each(d => {
          d.color.h = artisticToScientificSmooth(rootHue)
          d.color.s = 1
          d.color.v = 0.25 + 0.75 * Math.random()
        })
        break
      case colorModes.COMPLEMENTARY:
        this.getVisibleMarkers().each((d, index) => {
          let newHue = (rootHue + (index % 2) * 180 + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1 - offsetFactor * stepFn(2)(index)
          d.color.v = 1
        })
        break
      case colorModes.TRIAD:
        this.getVisibleMarkers().each((d, index) => {
          let newHue = (rootHue + (index % 3) * 120 + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1 - offsetFactor * stepFn(3)(index)
          d.color.v = 1
        })
        break
      case colorModes.TETRAD:
        this.getVisibleMarkers().each((d, index) => {
          let newHue = (rootHue + (index % 4) * 90 + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1 - offsetFactor * stepFn(4)(index)
          d.color.v = 1
        })
        break
    }
    this.dispatch.markersUpdated()
  }

  updateHarmony(target, theta) {
    let root = this.getRootMarker()
    let rootHue = scientificToArtisticSmooth(root.datum().color.h)

    let cursor = target
    let counter = 0

    // Find out how far the dragging marker is from the root marker.
    while ((cursor = cursor.previousSibling)) {
      if (cursor.getAttribute('visibility') === 'hidden') continue
      counter++
    }

    let targetDistance = markerDistance(counter)

    switch (this.currentMode) {
      case colorModes.ANALOGOUS:
        this.getVisibleMarkers().each(function (currentDatum, index) {
          let markerEl = this
          let $marker = d3.select(markerEl)
          let startingHue = parseFloat($marker.attr('data-startingHue'))
          let slices = 1

          if (targetDistance !== 0) {
            slices = markerDistance(index) / targetDistance
          }
          if (markerEl !== target) {
            currentDatum.color.h = artisticToScientificSmooth(
              (startingHue + slices * theta + 720) % 360
            )
          }
        })
        break
      case colorModes.SHADES: {
        this.getVisibleMarkers().each(d => (d.color.s = 1))
        // Fallthrough
      }
      case colorModes.MONOCHROMATIC:
      case colorModes.COMPLEMENTARY:
      case colorModes.TRIAD:
      case colorModes.TETRAD:
        this.getVisibleMarkers().each(function (currentDatum) {
          let markerEl = this
          let $marker = d3.select(markerEl)
          let startingHue = parseFloat($marker.attr('data-startingHue'))

          currentDatum.color.h = artisticToScientificSmooth(
            (startingHue + theta + 720) % 360
          )
        })
        break
    }
    this.dispatch.markersUpdated()
  }

  getColorsAsHEX() {
    return this._getColorsAs('toHexString')
  }
  getColorsAsRGB() {
    return this._getColorsAs('toRgbString')
  }
  getColorsAsHSL() {
    return this._getColorsAs('toHslString')
  }
  getColorsAsHSV() {
    return this._getColorsAs('toHsvString')
  }
  _getColorsAs(toFunk) {
    return this.getVisibleMarkers()
      .data()
      .sort((a, b) => a.color.h - b.color.h)
      .map(d =>
        tinycolor({ h: d.color.h, s: d.color.s, v: d.color.v })[toFunk]()
      )
  }

  setMode(mode) {
    ColorWheel.checkIfModeExists(mode)
    this.currentMode = mode
    this.setHarmony()
    this.dispatch.updateEnd()
    this.dispatch.modeChanged()
  }

  getMarkers() {
    return this.container.selectAll(this.selector('marker'))
  }

  getVisibleMarkers() {
    return this.container.selectAll(
      this.selector('marker') + '[visibility=visible]'
    )
  }

  getRootMarker() {
    return this.container.select(
      this.selector('marker') + '[visibility=visible]'
    )
  }

  selector(className) {
    return '.' + this.cx(className)
  }

  // Utility for building internal class name strings
  cx(className) {
    return this.options.baseClassName + '-' + className
  }

  // For creating custom markers
  static createMarker(color, name, show) {
    return new ColorWheelMarkerDatum(color, name, show)
  }
}
