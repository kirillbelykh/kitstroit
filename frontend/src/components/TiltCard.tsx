import { useRef, type ReactNode, type PointerEvent } from 'react'
import { computeTilt } from './tiltMath'

export function TiltCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  function setVars(rx: number, ry: number, gx: number, gy: number) {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--tilt-rx', `${rx}deg`)
    el.style.setProperty('--tilt-ry', `${ry}deg`)
    el.style.setProperty('--tilt-gx', `${gx}%`)
    el.style.setProperty('--tilt-gy', `${gy}%`)
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = rootRef.current
    const card = cardRef.current
    if (!el || !card) return
    const { rx, ry, gx, gy } = computeTilt(event.clientX, event.clientY, el.getBoundingClientRect())
    setVars(rx, ry, gx, gy)
    card.classList.add('is-tilting')
    el.classList.add('is-hover')
  }

  function onPointerLeave() {
    const el = rootRef.current
    const card = cardRef.current
    if (!el || !card) return
    card.classList.remove('is-tilting')
    el.classList.remove('is-hover')
    setVars(0, 0, 50, 50)
  }

  return (
    <div
      ref={rootRef}
      className={`t-tilt ${className}`.trim()}
      onPointerMove={onPointerMove}
      onPointerEnter={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div ref={cardRef} className="t-tilt-card">
        {children}
        <div className="t-tilt-glare" aria-hidden="true" />
      </div>
    </div>
  )
}
