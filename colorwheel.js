// Color Wheel with D3
// http://github.com/benknight/kuler-d3
// Benjamin Knight
// MIT License

;(function (root, factory) {
  // AMD/requirejs: Define the module
  if (typeof define === 'function' && define.amd) {
    define(['tinycolor', 'd3'], factory)
  } else {
    // Expose to browser window
    root.ColorWheel = factory(root.tinycolor, root.d3)
  }
})(this, function (tinycolor, d3) {
  'use strict'

  var ColorWheelMarkerDatum = function ColorWheelMarkerDatum(
    color,
    name,
    show
  ) {
    this.color = tinycolor(color).toHsv()
    this.name = name
    this.show = show
  }

  var ColorWheel = function ColorWheel(options) {
    var self = this

    // --- Settings ---

    this.options = {
      container: document.body,
      radius: 175,
      margin: 40, // space around the edge of the wheel
      markerWidth: 40,
      defaultSlice: 20,
      initRoot: 'red',
      initMode: ColorWheel.modes.ANALOGOUS,
      baseClassName: 'colorwheel',
    }

    // Merge default options with options param. (Similar to jQuery.extend)
    if (typeof options === 'object') {
      for (var option in options) {
        if (option == 'initMode') {
          ColorWheel.checkIfModeExists(options.initMode)
        }
        this.options[option] = options[option]
      }
    }

    var diameter = this.options.radius * 2
    this.currentMode = this.options.initMode
    this.container = d3.select(this.options.container)

    this.slice = this.options.defaultSlice

    // --- Nodes ---

    this.$ = {}

    this.$.wheel = this.container.append('svg').attr({
      class: this.options.baseClassName,
      width: diameter,
      height: diameter,
      viewBox: [
        -1 * this.options.margin,
        -1 * this.options.margin,
        diameter + 2 * this.options.margin,
        diameter + 2 * this.options.margin,
      ].join(' '),
    })

    this.$.wheel.append('circle').attr({
      fill: 'black',
      r: this.options.radius,
      cx: this.options.radius,
      cy: this.options.radius,
      transform: 'translate(4, 4)',
    })

    this.$.wheel.append('image').attr({
      width: diameter,
      height: diameter,
      'xlink:href': 'http://benknight.github.io/kuler-d3/wheel.png',
    })

    this.$.markerTrails = this.$.wheel.append('g')
    this.$.markers = this.$.wheel.append('g')

    // --- Events ---

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

    this.dispatch.on('bindData.default', function () {
      self.setHarmony()
    })

    this.dispatch.on('markersUpdated.default', function () {
      self
        .getMarkers()
        .attr({
          transform: function (d) {
            var hue = scientificToArtisticSmooth(d.color.h)
            var p = getSVGPositionFromHS(
              d.color.h,
              d.color.s,
              this.options.radius
            )
            return ['translate(' + [p.x, p.y].join() + ')'].join(' ')
          },
          visibility: d => (d.show ? 'visible' : 'hidden'),
        })
        .select('circle')
        .attr({
          fill: d => hexFromHS(d.color.h, d.color.s),
        })

      self.container.selectAll(self.selector('marker-trail')).attr({
        x2: function (d) {
          var p = getSVGPositionFromHS(
            d.color.h,
            d.color.s,
            self.options.radius
          )
          return p.x
        },
        y2: function (d) {
          var p = getSVGPositionFromHS(
            d.color.h,
            d.color.s,
            self.options.radius
          )
          return p.y
        },
        visibility: d => (d.show ? 'visible' : 'hidden'),
      })
    })

    this.dispatch.on('modeChanged.default', function () {
      self.container.attr('data-mode', self.currentMode)
    })

    // --- Plugins ---

    for (var pluginId in ColorWheel.plugins) {
      if (typeof ColorWheel.plugins[pluginId] == 'function') {
        ColorWheel.plugins[pluginId](this)
      }
    }
  }

  ColorWheel.prototype.bindData = function (newData) {
    var self = this

    // Data can be passed as a whole number,
    // or an array of ColorWheelMarkerDatum.
    if (newData.constructor === Array) {
      var data = newData
      this.setMode(ColorWheel.modes.CUSTOM)
    } else {
      // We weren't given any data so create our own.
      var numColors = typeof newData === 'number' ? newData : 5
      var data = Array.apply(null, { length: numColors }).map(function () {
        return new ColorWheelMarkerDatum(self.options.initRoot, null, true)
      })
    }

    var markerTrails = this.$.markerTrails
      .selectAll(this.selector('marker-trail'))
      .data(data)

    markerTrails
      .enter()
      .append('line')
      .attr({
        class: this.cx('marker-trail'),
        x1: this.options.radius,
        y1: this.options.radius,
        stroke: 'white',
        'stroke-opacity': 0.75,
        'stroke-width': 3,
        'stroke-dasharray': '10, 6',
      })

    markerTrails.exit().remove()

    var markers = this.$.markers.selectAll(this.selector('marker')).data(data)

    markers
      .enter()
      .append('g')
      .attr({
        class: this.cx('marker'),
        visibility: 'visible',
      })
      .append('circle')
      .attr({
        r: this.options.markerWidth / 2,
        stroke: 'white',
        'stroke-width': 2,
        'stroke-opacity': 0.9,
        cursor: 'move',
      })

    markers.exit().remove()

    markers
      .append('text')
      .text(function (d) {
        return d.name
      })
      .attr({
        x: this.options.markerWidth / 2 + 8,
        y: this.options.markerWidth / 4 - 5,
        fill: 'white',
        'font-size': '13px',
      })

    markers.call(this.getDragBehavior())

    this.dispatch.bindData(data)
    this.dispatch.markersUpdated()
    this.dispatch.updateEnd()
  }

  ColorWheel.prototype.getDragBehavior = function () {
    return d3.behavior
      .drag()
      .on('drag', d => {
        let { radius } = this.options
        let pos = clampToCircle(d3.event.x, d3.event.y)
        let hs = getHSFromSVGPosition(pos.x, pos.y, radius)

        d.color.h = hs.h
        d.color.s = hs.s

        let p = svgToCartesian(d3.event.x, d3.event.y, radius)
        let dragHue = ((Math.atan2(p.y, p.x) * 180) / Math.PI + 720) % 360
        let startingHue = parseFloat(d3.select(this).attr('data-startingHue'))

        let theta1 = (360 + startingHue - dragHue) % 360
        let theta2 = (360 + dragHue - startingHue) % 360

        this.updateHarmony(this, theta1 < theta2 ? -1 * theta1 : theta2)
      })
      .on('dragstart', () => d => scientificToArtisticSmooth(d.color.h))
      .on('dragend', () => {
        let visibleMarkers = this.getVisibleMarkers()
        visibleMarkers.attr('data-startingHue', null)

        if (this.currentMode === ColorWheel.modes.ANALOGOUS) {
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
  ;(ColorWheel.prototype.getMarkers = function () {
    return this.container.selectAll(this.selector('marker'))
  }),
    (ColorWheel.prototype.getVisibleMarkers = function () {
      return this.container.selectAll(
        this.selector('marker') + '[visibility=visible]'
      )
    }),
    (ColorWheel.prototype.getRootMarker = function () {
      return this.container.select(
        this.selector('marker') + '[visibility=visible]'
      )
    }),
    (ColorWheel.prototype.setHarmony = function () {
      var self = this
      var root = this.getRootMarker()
      var offsetFactor = 0.08
      this.getMarkers().classed('root', false)

      if (!root.empty()) {
        var rootHue = scientificToArtisticSmooth(root.datum().color.h)
        switch (this.currentMode) {
          case ColorWheel.modes.ANALOGOUS:
            root.classed('root', true)
            this.getVisibleMarkers().each(function (d, i) {
              let newHue =
                (rootHue + markerDistance(i) * self.slice + 720) % 360
              d.color.h = artisticToScientificSmooth(newHue)
              d.color.s = 1
              d.color.v = 1
            })
            break
          case ColorWheel.modes.MONOCHROMATIC:
          case ColorWheel.modes.SHADES:
            this.getVisibleMarkers().each(function (d, i) {
              d.color.h = artisticToScientificSmooth(rootHue)
              if (self.currentMode == ColorWheel.modes.SHADES) {
                d.color.s = 1
                d.color.v = 0.25 + 0.75 * Math.random()
              } else {
                d.color.s = 1 - (0.15 * i + Math.random() * 0.1)
                d.color.v = 0.75 + 0.25 * Math.random()
              }
            })
            break
          case ColorWheel.modes.COMPLEMENTARY:
            this.getVisibleMarkers().each(function (d, i) {
              let newHue = (rootHue + (i % 2) * 180 + 720) % 360
              d.color.h = artisticToScientificSmooth(newHue)
              d.color.s = 1 - offsetFactor * stepFn(2)(i)
              d.color.v = 1
            })
            break
          case ColorWheel.modes.TRIAD:
            this.getVisibleMarkers().each(function (d, i) {
              let newHue = (rootHue + (i % 3) * 120 + 720) % 360
              d.color.h = artisticToScientificSmooth(newHue)
              d.color.s = 1 - offsetFactor * stepFn(3)(i)
              d.color.v = 1
            })
            break
          case ColorWheel.modes.TETRAD:
            this.getVisibleMarkers().each(function (d, i) {
              let newHue = (rootHue + (i % 4) * 90 + 720) % 360
              d.color.h = artisticToScientificSmooth(newHue)
              d.color.s = 1 - offsetFactor * stepFn(4)(i)
              d.color.v = 1
            })
            break
        }
        this.dispatch.markersUpdated()
      }
    })

  ColorWheel.prototype.updateHarmony = function (target, theta) {
    var self = this
    var root = this.getRootMarker()
    var rootHue = scientificToArtisticSmooth(root.datum().color.h)

    // Find out how far the dragging marker is from the root marker.
    var cursor = target
    var counter = 0
    while ((cursor = cursor.previousSibling)) {
      if (cursor.getAttribute('visibility') !== 'hidden') {
        counter++
      }
    }
    var targetDistance = ColorWheel.markerDistance(counter)

    switch (this.currentMode) {
      case ColorWheel.modes.ANALOGOUS:
        this.getVisibleMarkers().each(function (d, i) {
          var startingHue = parseFloat(d3.select(this).attr('data-startingHue'))
          var slices = 1
          if (targetDistance !== 0) {
            slices = markerDistance(i) / targetDistance
          }
          if (this !== target) {
            d.color.h = artisticToScientificSmooth(
              (startingHue + slices * theta + 720) % 360
            )
          }
        })
        break
      case ColorWheel.modes.MONOCHROMATIC:
      case ColorWheel.modes.COMPLEMENTARY:
      case ColorWheel.modes.SHADES:
      case ColorWheel.modes.TRIAD:
      case ColorWheel.modes.TETRAD:
        this.getVisibleMarkers().each(function (d) {
          var startingHue = parseFloat(d3.select(this).attr('data-startingHue'))
          d.color.h = artisticToScientificSmooth(
            (startingHue + theta + 720) % 360
          )
          if (self.currentMode == ColorWheel.modes.SHADES) {
            d.color.s = 1
          }
        })
        break
    }
    self.dispatch.markersUpdated()
  }

  ColorWheel.prototype._getColorsAs = function (toFunk) {
    return this.getVisibleMarkers()
      .data()
      .sort((a, b) => a.color.h - b.color.h)
      .map(d =>
        tinycolor({ h: d.color.h, s: d.color.s, v: d.color.v })[toFunk]()
      )
  }

  ColorWheel.prototype.getColorsAsHEX = function () {
    return this._getColorsAs('toHexString')
  }

  ColorWheel.prototype.getColorsAsRGB = function () {
    return this._getColorsAs('toRgbString')
  }

  ColorWheel.prototype.getColorsAsHSL = function () {
    return this._getColorsAs('toHslString')
  }

  ColorWheel.prototype.getColorsAsHSV = function () {
    return this._getColorsAs('toHsvString')
  }

  ColorWheel.prototype.setMode = function (mode) {
    ColorWheel.checkIfModeExists(mode)
    this.currentMode = mode
    this.setHarmony()
    this.dispatch.updateEnd()
    this.dispatch.modeChanged()
  }

  // Utility for building internal classname strings
  ColorWheel.prototype.cx = function (className) {
    return this.options.baseClassName + '-' + className
  }

  ColorWheel.prototype.selector = function (className) {
    return '.' + this.cx(className)
  }

  // These modes define a relationship between the colors on a color wheel,
  // based on "science".
  ColorWheel.modes = {
    CUSTOM: 'Custom',
    ANALOGOUS: 'Analogous',
    COMPLEMENTARY: 'Complementary',
    TRIAD: 'Triad',
    TETRAD: 'Tetrad',
    MONOCHROMATIC: 'Monochromatic',
    SHADES: 'Shades',
  }

  // Throw an error if someone gives us a bad mode.
  ColorWheel.checkIfModeExists = function (mode) {
    var modeExists = false
    for (var possibleMode in ColorWheel.modes) {
      if (ColorWheel.modes[possibleMode] == mode) {
        modeExists = true
        break
      }
    }
    if (!modeExists) {
      throw Error('Invalid mode specified: ' + mode)
    }
    return true
  }

  // For creating custom markers
  ColorWheel.createMarker = function (color, name, show) {
    return new ColorWheelMarkerDatum(color, name, show)
  }

  // Provide a plugin interface
  ColorWheel.plugins = {}

  ColorWheel.extend = function (pluginId, pluginFn) {
    this.plugins[pluginId] = pluginFn
  }

  return ColorWheel
})
