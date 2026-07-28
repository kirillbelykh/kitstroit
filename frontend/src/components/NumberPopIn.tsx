import { useEffect, useRef, useState } from 'react'

export function NumberPopIn({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimating(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setAnimating(true)
        observer.unobserve(el)
      },
      { threshold: 0.4 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <span ref={ref} className={`t-digit-group${animating ? ' is-animating' : ''}`}>
      {value.split('').map((ch, i) => (
        <span
          key={`${ch}-${i}`}
          className="t-digit"
          style={i > 0 ? { animationDelay: `calc(var(--digit-stagger) * ${i})` } : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}
