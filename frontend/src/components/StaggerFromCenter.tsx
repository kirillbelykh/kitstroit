import { motion, useInView, useReducedMotion } from 'motion/react'
import { useRef } from 'react'

export interface StaggerFromCenterProps {
  children: string
  className?: string
  /** Delay before the animation starts, in milliseconds. */
  delay?: number
  /** Per-step stagger between characters, in milliseconds. */
  stagger?: number
  /** Animate only once the text scrolls into view. */
  triggerOnView?: boolean
  /**
   * Italic + serif from this character index (preserves former `<em>` on
   * «предсказуемо.»). Optional so the catalog API stays string-only.
   */
  emphasisFrom?: number
}

const DURATION_S = 0.62
const MS = 1000
// Apple-ish ease-out for center-out reveal.
const EASE = [0.22, 1, 0.36, 1] as const

type GlyphGroup = { startIndex: number; chars: string[] }

/** Keep words intact for wrapping; spaces stay as their own groups. */
function groupGlyphs(text: string): GlyphGroup[] {
  const characters = Array.from(text)
  const groups: GlyphGroup[] = []
  let chars: string[] = []
  let startIndex = 0

  characters.forEach((char, index) => {
    if (/\s/.test(char)) {
      if (chars.length) {
        groups.push({ startIndex, chars })
        chars = []
      }
      groups.push({ startIndex: index, chars: [char] })
      return
    }
    if (!chars.length) startIndex = index
    chars.push(char)
  })
  if (chars.length) groups.push({ startIndex, chars })
  return groups
}

/**
 * StaggerFromCenter — characters reveal from the center outward to
 * emphasize the keyword core. Delay is computed by distance from center,
 * not linear index. From the animate-text catalog (`stagger-from-center`).
 */
export default function StaggerFromCenter({
  children,
  className = '',
  delay = 0,
  stagger = 22,
  triggerOnView = false,
  emphasisFrom,
}: StaggerFromCenterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const shouldReduceMotion = useReducedMotion()
  const play = (!triggerOnView || inView) && !shouldReduceMotion
  const characters = Array.from(children)
  const center = (characters.length - 1) / 2
  const groups = groupGlyphs(children)

  return (
    <span aria-label={children} className={className} ref={ref}>
      {groups.map((group) => {
        const isSpace = group.chars.length === 1 && /\s/.test(group.chars[0])
        return (
          <span
            key={group.startIndex}
            className={isSpace ? 'stagger-space' : 'stagger-word'}
          >
            {group.chars.map((char, offset) => {
              const index = group.startIndex + offset
              const distance = Math.abs(index - center)
              const emphasized = emphasisFrom != null && index >= emphasisFrom
              return (
                <motion.span
                  animate={
                    play ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined
                  }
                  aria-hidden="true"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, y: 12, filter: 'blur(3px)' }
                  }
                  // ponytail: index keys — glyphs have no stable id; text is static.
                  key={index}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    ...(emphasized
                      ? { fontStyle: 'italic', fontFamily: 'var(--serif)' }
                      : null),
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : {
                          duration: DURATION_S,
                          delay: delay / MS + (distance * stagger) / MS,
                          ease: EASE,
                        }
                  }
                >
                  {char === ' ' ? '\u00a0' : char}
                </motion.span>
              )
            })}
          </span>
        )
      })}
    </span>
  )
}
