import chroma from 'chroma-js'

// These two functions are ripped straight from Kuler source.
// They convert between scientific hue to the color wheel's "artistic" hue.
export function artisticToScientificSmooth(hue) {
  return hue < 60
    ? hue * (35 / 60)
    : hue < 122
    ? mapRange(hue, [60, 122], [35, 60])
    : hue < 165
    ? mapRange(hue, [122, 165], [60, 120])
    : hue < 218
    ? mapRange(hue, [165, 218], [120, 180])
    : hue < 275
    ? mapRange(hue, [218, 275], [180, 240])
    : hue < 330
    ? mapRange(hue, [275, 330], [240, 300])
    : mapRange(hue, [330, 360], [300, 360])
}

export function scientificToArtisticSmooth(hue) {
  return hue < 35
    ? hue * (60 / 35)
    : hue < 60
    ? mapRange(hue, [35, 60], [60, 122])
    : hue < 120
    ? mapRange(hue, [60, 120], [122, 165])
    : hue < 180
    ? mapRange(hue, [120, 180], [165, 218])
    : hue < 240
    ? mapRange(hue, [180, 240], [218, 275])
    : hue < 300
    ? mapRange(hue, [240, 300], [275, 330])
    : mapRange(hue, [300, 360], [330, 360])
}

/**
 * Map a value from one range to the equivalent value in an other range
 * For example, mapRange(5, [0, 10], [0, 100]) =>  50
 */
function mapRange(value, fromRange, toRange) {
  const [fromLower, fromUpper] = fromRange
  const [toLower, toUpper] = toRange

  return (
    toLower +
    (value - fromLower) * ((toUpper - toLower) / (fromUpper - fromLower))
  )
}

/**
 * Get a hex string from hue and sat components,
 * with 100% brightness.
 */
export function hexFromHS(h, s) {
  return chroma({ h: h, s: s, v: 1 }).hex()
}

/**
 * Used to determine the distance from the root marker.
 * (The first DOM node with marker class)
 * Domain: [0, 1,  2, 3,  4, ... ]
 * Range:  [0, 1, -1, 2, -2, ... ]
 */
export function markerDistance(i) {
  return Math.ceil(i / 2) * Math.pow(-1, i + 1)
}

/**
 * Returns a step function with the given base.
 * e.g. with base = 3, returns a function with this domain/range:
 * Domain: [0, 1, 2, 3, 4, 5, ...]
 * Range:  [0, 0, 0, 1, 1, 1, ...]
 */
export function stepFn(base) {
  return x => Math.floor(x / base)
}

/**
 * Given an SVG point (x, y), returns the closest point
 * to (x, y) still in the circle.
 */
export function clampToCircle(x, y, radius) {
  let p = svgToCartesian(x, y, radius)

  if (Math.sqrt(p.x * p.x + p.y * p.y) <= radius) {
    return { x: x, y: y }
  }

  let theta = Math.atan2(p.y, p.x)
  let x_ = radius * Math.cos(theta)
  let y_ = radius * Math.sin(theta)

  return cartesianToSVG(x_, y_, radius)
}

/** Get a coordinate pair from hue and saturation components */
export function getSVGPositionFromHS(h, s, radius) {
  let hue = scientificToArtisticSmooth(h)
  let theta = hue * (Math.PI / 180)
  let y = Math.sin(theta) * radius * s
  let x = Math.cos(theta) * radius * s
  return cartesianToSVG(x, y, radius)
}

/** Inverse of `getSVGPositionFromHS` */
export function getHSFromSVGPosition(x, y, radius) {
  let p = svgToCartesian(x, y, radius)
  let theta = Math.atan2(p.y, p.x)

  let artisticHue = (theta * (180 / Math.PI) + 360) % 360
  let scientificHue = artisticToScientificSmooth(artisticHue)

  let s = Math.min(Math.sqrt(p.x * p.x + p.y * p.y) / radius, 1)
  return { h: scientificHue, s: s }
}

export function svgToCartesian(x, y, radius) {
  return { x: x - radius, y: radius - y }
}

export function cartesianToSVG(x, y, radius) {
  return { x: x + radius, y: radius - y }
}
