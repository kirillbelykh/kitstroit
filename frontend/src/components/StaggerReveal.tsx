import { useEffect, useRef, useState } from 'react'

function splitAnswer(text: string): [string, string] {
  const match = text.match(/^(.+?[.!?])\s+(.+)$/s)
  if (match) return [match[1], match[2]]
  const mid = Math.ceil(text.length / 2)
  const space = text.indexOf(' ', mid)
  if (space > 0) return [text.slice(0, space), text.slice(space + 1)]
  return [text, '']
}

export function StaggerReveal({ open, text }: { open: boolean; text: string }) {
  const [shown, setShown] = useState(false)
  const [hiding, setHiding] = useState(false)
  const timerRef = useRef<number | null>(null)
  const wasOpenRef = useRef(false)
  const [primary, secondary] = splitAnswer(text)

  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current)

    if (open) {
      wasOpenRef.current = true
      setHiding(false)
      setShown(false)
      const id = window.requestAnimationFrame(() => setShown(true))
      return () => window.cancelAnimationFrame(id)
    }

    if (!wasOpenRef.current) return

    setShown(false)
    setHiding(true)
    timerRef.current = window.setTimeout(() => setHiding(false), 200)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [open])

  const cls = `t-stagger${shown ? ' is-shown' : ''}${hiding ? ' is-hiding' : ''}`

  return (
    <div className={cls}>
      <p className="t-stagger-line t-stagger-line--1">{primary}</p>
      {secondary ? <p className="t-stagger-line t-stagger-line--2">{secondary}</p> : null}
    </div>
  )
}
