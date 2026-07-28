export function computeTilt(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
  maxDeg = 10,
): { rx: number; ry: number; gx: number; gy: number } {
  const px = (clientX - rect.left) / rect.width
  const py = (clientY - rect.top) / rect.height
  const ry = (px - 0.5) * 2 * maxDeg
  const rx = (0.5 - py) * 2 * maxDeg
  return { rx, ry, gx: px * 100, gy: py * 100 }
}
