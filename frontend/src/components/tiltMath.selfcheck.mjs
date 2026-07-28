function computeTilt(clientX, clientY, rect, maxDeg = 10) {
  const px = (clientX - rect.left) / rect.width
  const py = (clientY - rect.top) / rect.height
  const ry = (px - 0.5) * 2 * maxDeg
  const rx = (0.5 - py) * 2 * maxDeg
  return { rx, ry, gx: px * 100, gy: py * 100 }
}

const center = computeTilt(50, 50, { left: 0, top: 0, width: 100, height: 100 })
if (Math.abs(center.rx) > 1e-9 || Math.abs(center.ry) > 1e-9) throw new Error('center must be flat')
const right = computeTilt(100, 50, { left: 0, top: 0, width: 100, height: 100 })
if (right.ry !== 10 || right.gx !== 100) throw new Error('right edge tilt failed')
console.log('tiltMath.selfcheck: ok')
