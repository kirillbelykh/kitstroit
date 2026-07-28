import { useEffect, useRef } from 'react'

const PATH_D = 'M1 5.52L3.92 9.17L9.17 1'

export function ConsentCheck({
  checked,
  onChange,
  invalid = false,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  invalid?: boolean
}) {
  const pathRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = Math.ceil(path.getTotalLength())
    path.style.setProperty('--check-len', String(len))
  }, [])

  return (
    <button
      type="button"
      className="t-check"
      role="checkbox"
      aria-checked={checked}
      aria-invalid={invalid || undefined}
      aria-label="Согласен с обработкой персональных данных"
      onClick={() => onChange(!checked)}
    >
      <svg viewBox="0 0 10.1668 10.1668" aria-hidden="true">
        <path ref={pathRef} d={PATH_D} />
      </svg>
    </button>
  )
}
