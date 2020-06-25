import d3 from 'd3'
import chroma from 'chroma-js'

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
    let [h, s, v] = chroma(color).hsv()
    this.color = {h, s, v}

    this.name = name
    this.show = show
  }
}

/**
 * These modes define a relationship between the colors on a
 * color wheel, based on "science".
 */
export const colorModes = {
  CUSTOM: 'custom',
  ANALOGOUS: 'analogous',
  COMPLEMENTARY: 'complementary',
  TRIAD: 'triad',
  TETRAD: 'tetrad',
  MONOCHROMATIC: 'monochromatic',
  SHADES: 'shades',
}

export class TintedWheel {
  static MODES = colorModes

  static DEFAULT_OPTIONS = {
    container: document.body,
    radius: 100,
    markerWidth: 25,
    markerOutlineWidth: 1,
    margin: 25 / 2 + 1,
    defaultSlice: 20,
    initRoot: 'red',
    initMode: colorModes.ANALOGOUS,
    baseClassName: 'tinted',
    colorWheelImage: 'https://zposten.github.io/tinted/demo/wheel.png',
  }

  constructor(options) {
    this.options = {
      ...TintedWheel.DEFAULT_OPTIONS,
      ...options,
    }

    this._init()
  }

  _init() {
    const {initMode, container, defaultSlice} = this.options

    this._ensureModeExists(initMode)

    this.currentMode = initMode
    this.container = d3.select(container)
    this.slice = defaultSlice

    this._createWheelDOM()
    this._bindEvents()
  }

  _createWheelDOM() {
    const {radius, margin, colorWheelImage} = this.options
    let diameter = radius * 2

    let wheel = this.container.attr({
      viewBox: [
        -1 * margin,
        -1 * margin,
        diameter + 2 * margin,
        diameter + 2 * margin,
      ].join(' '),
    })

    wheel.append('circle').attr({
      fill: 'black',
      r: radius,
      cx: radius,
      cy: radius,
    })

    wheel.append('image').attr({
      width: diameter,
      height: diameter,
      href: colorWheelImage,
    })

    let markerTrails = wheel.append('g')
    let markers = wheel.append('g')

    this.$ = {wheel, markers, markerTrails}
  }

  _bindEvents() {
    const {radius} = this.options

    // Create a dispatch with 4 custom events
    this.dispatch = d3.dispatch(
      // Initial data was successfully bound.
      'bindData',
      // Markers datum has changed, so redraw as necessary, etc.
      'markersUpdated',
      // "updateEnd" means the state of the ColorWheel has been finished updating.
      'updateEnd',
      // The mode was changed
      'modeChanged',
    )

    this.dispatch.on('markersUpdated', () => {
      this._getMarkers()
        .attr({
          visibility: d => (d.show ? 'visible' : 'hidden'),
          transform: d => {
            let position = getSVGPositionFromHS(d.color.h, d.color.s, radius)
            return `translate(${position.x}, ${position.y})`
          },
        })
        .select('circle')
        .attr({fill: d => hexFromHS(d.color.h, d.color.s)})

      this.container.selectAll(this.selector('marker-trail')).attr({
        x2: d => getSVGPositionFromHS(d.color.h, d.color.s, radius).x,
        y2: d => getSVGPositionFromHS(d.color.h, d.color.s, radius).y,
        visibility: d => (d.show ? 'visible' : 'hidden'),
      })
    })

    this.dispatch.on('modeChanged', () => {
      this.container.attr('data-mode', this.currentMode)
    })
  }

  bindData(userData) {
    const {initRoot} = this.options
    let colorData

    // Data can be passed as a whole number,
    // or an array of ColorWheelMarkerDatum.
    if (Array.isArray(userData)) {
      colorData = userData.map(
        color => new ColorWheelMarkerDatum(color, null, true),
      )

      this.setMode(colorModes.CUSTOM)
    } else {
      // We weren't given any data so create our own.
      let numColors = typeof userData === 'number' ? userData : 5
      colorData = []

      for (let i = 0; i < numColors; ++i) {
        let datum = new ColorWheelMarkerDatum(initRoot, null, true)
        colorData.push(datum)
      }
    }

    this._createMarkerDOMElements(colorData)
    this.setHarmony()

    this.dispatch.bindData(colorData)
    this.dispatch.markersUpdated()
    this.dispatch.updateEnd()
  }

  _createMarkerDOMElements(data) {
    const {radius, markerWidth, markerOutlineWidth} = this.options

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
        'stroke-opacity': 0.75,
        'stroke-width': 1,
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
        'stroke-width': markerOutlineWidth,
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

    let dragBehavior = this._createDragBehavior()
    markers.call(dragBehavior)
  }

  _createDragBehavior() {
    const self = this

    return d3.behavior
      .drag()
      .on('drag', function (d) {
        let markerEl = this
        let {radius} = self.options

        let pos = clampToCircle(d3.event.x, d3.event.y, radius)
        let hs = getHSFromSVGPosition(pos.x, pos.y, radius)

        d.color.h = hs.h
        d.color.s = hs.s

        let p = svgToCartesian(d3.event.x, d3.event.y, radius)
        let dragHue = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 720) % 360

        let startingHue = parseFloat(
          d3.select(markerEl).attr('data-startingHue'),
        )

        let theta1 = (360 + startingHue - dragHue) % 360
        let theta2 = (360 + dragHue - startingHue) % 360

        self.updateHarmony(this, theta1 < theta2 ? -1 * theta1 : theta2)
      })
      .on('dragstart', () => {
        this._getVisibleMarkers().attr('data-startingHue', d =>
          scientificToArtisticSmooth(d.color.h),
        )
      })
      .on('dragend', () => {
        let visibleMarkers = this._getVisibleMarkers()
        visibleMarkers.attr('data-startingHue', null)

        if (this.currentMode === colorModes.ANALOGOUS) {
          let rootTheta = scientificToArtisticSmooth(
            d3.select(visibleMarkers[0][0]).datum().color.h,
          )

          if (visibleMarkers[0].length > 1) {
            let neighborTheta = scientificToArtisticSmooth(
              d3.select(visibleMarkers[0][1]).datum().color.h,
            )
            this.slice = (360 + neighborTheta - rootTheta) % 360
          }
        }

        this.dispatch.updateEnd()
      })
  }

  setHarmony() {
    let root = this._getRootMarker()
    let offsetFactor = 0.08
    this._getMarkers().classed('root', false)

    if (root.empty()) return

    let rootHue = scientificToArtisticSmooth(root.datum().color.h)

    switch (this.currentMode) {
      case colorModes.ANALOGOUS:
        root.classed('root', true)
        this._getVisibleMarkers().each((d, index) => {
          let newHue =
            (rootHue + markerDistance(index) * this.slice + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1
          d.color.v = 1
        })
        break
      case colorModes.MONOCHROMATIC:
        this._getVisibleMarkers().each(function (d, i) {
          d.color.h = artisticToScientificSmooth(rootHue)
          d.color.s = 1 - (0.15 * i + Math.random() * 0.1)
          d.color.v = 0.75 + 0.25 * Math.random()
        })
        break
      case colorModes.SHADES:
        this._getVisibleMarkers().each(d => {
          d.color.h = artisticToScientificSmooth(rootHue)
          d.color.s = 1
          d.color.v = 0.25 + 0.75 * Math.random()
        })
        break
      case colorModes.COMPLEMENTARY:
        this._getVisibleMarkers().each((d, index) => {
          let newHue = (rootHue + (index % 2) * 180 + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1 - offsetFactor * stepFn(2)(index)
          d.color.v = 1
        })
        break
      case colorModes.TRIAD:
        this._getVisibleMarkers().each((d, index) => {
          let newHue = (rootHue + (index % 3) * 120 + 720) % 360
          d.color.h = artisticToScientificSmooth(newHue)
          d.color.s = 1 - offsetFactor * stepFn(3)(index)
          d.color.v = 1
        })
        break
      case colorModes.TETRAD:
        this._getVisibleMarkers().each((d, index) => {
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
        this._getVisibleMarkers().each(function (currentDatum, index) {
          let markerEl = this
          if (markerEl === target) return

          let $marker = d3.select(markerEl)
          let startingHue = parseFloat($marker.attr('data-startingHue'))

          let slices =
            targetDistance === 0 ? 1 : markerDistance(index) / targetDistance

          let adjustedHue = (startingHue + slices * theta + 720) % 360
          currentDatum.color.h = artisticToScientificSmooth(adjustedHue)
        })
        break
      case colorModes.SHADES:
      case colorModes.MONOCHROMATIC:
      case colorModes.COMPLEMENTARY:
      case colorModes.TRIAD:
      case colorModes.TETRAD:
        this._getVisibleMarkers().each(function (d) {
          if (this.currentMode === colorModes.SHADES) d.color.s = 1

          let markerEl = this
          let $marker = d3.select(markerEl)

          let startingHue = parseFloat($marker.attr('data-startingHue'))
          let adjustedHue = (startingHue + theta + 720) % 360
          d.color.h = artisticToScientificSmooth(adjustedHue)
        })
        break
    }
    this.dispatch.markersUpdated()
  }

  setMode(mode) {
    this._ensureModeExists(mode)

    this.currentMode = mode
    this.setHarmony()

    this.dispatch.modeChanged()
    this.dispatch.updateEnd()
  }

  _ensureModeExists(mode) {
    if (!Object.values(colorModes).includes(mode)) {
      throw new Error('Invalid mode specified: ' + mode)
    }
  }

  _getMarkers() {
    return this.container.selectAll(this.selector('marker'))
  }

  _getVisibleMarkers() {
    return this.container.selectAll(
      this.selector('marker') + '[visibility=visible]',
    )
  }

  _getRootMarker() {
    return this.container.select(
      this.selector('marker') + '[visibility=visible]',
    )
  }

  selector(className) {
    return '.' + this.cx(className)
  }

  // Utility for building internal class name strings
  cx(className) {
    return this.options.baseClassName + '-' + className
  }

  isInMode(mode) {
    return this.currentMode === colorModes[mode]
  }
}
