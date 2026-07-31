import { memo, type CSSProperties } from 'react'
import { AnimatePresence, motion, type MotionProps, type Variants } from 'motion/react'

type AnimationType = 'text' | 'word' | 'character' | 'line'
type AnimationVariant =
  | 'fadeIn'
  | 'blurIn'
  | 'blurInUp'
  | 'blurInDown'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleUp'
  | 'scaleDown'

type MotionTag = 'span' | 'strong' | 'p' | 'h2' | 'h3' | 'div'

const motionElements = {
  span: motion.span,
  strong: motion.strong,
  p: motion.p,
  h2: motion.h2,
  h3: motion.h3,
  div: motion.div,
} as const

export interface TextAnimateProps extends Omit<MotionProps, 'children'> {
  children: string
  className?: string
  segmentClassName?: string
  delay?: number
  duration?: number
  variants?: Variants
  as?: MotionTag
  by?: AnimationType
  startOnView?: boolean
  once?: boolean
  animation?: AnimationVariant
  accessible?: boolean
}

const staggerTimings: Record<AnimationType, number> = {
  text: 0.06,
  word: 0.05,
  character: 0.03,
  line: 0.06,
}

const defaultContainerVariants: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      delayChildren: 0,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.05,
      staggerDirection: -1,
    },
  },
}

const defaultItemVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1 },
  exit: { opacity: 0 },
}

const defaultItemAnimationVariants: Record<AnimationVariant, { container: Variants; item: Variants }> = {
  fadeIn: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, y: 20 },
      show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
      exit: { opacity: 0, y: 20, transition: { duration: 0.3 } },
    },
  },
  blurIn: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)' },
      show: { opacity: 1, filter: 'blur(0px)', transition: { duration: 0.3 } },
      exit: { opacity: 0, filter: 'blur(10px)', transition: { duration: 0.3 } },
    },
  },
  blurInUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)', y: 20 },
      show: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
          y: { duration: 0.3 },
          opacity: { duration: 0.4 },
          filter: { duration: 0.3 },
        },
      },
      exit: {
        opacity: 0,
        filter: 'blur(10px)',
        y: 20,
        transition: {
          y: { duration: 0.3 },
          opacity: { duration: 0.4 },
          filter: { duration: 0.3 },
        },
      },
    },
  },
  blurInDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { opacity: 0, filter: 'blur(10px)', y: -20 },
      show: {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        transition: {
          y: { duration: 0.3 },
          opacity: { duration: 0.4 },
          filter: { duration: 0.3 },
        },
      },
    },
  },
  slideUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { y: 20, opacity: 0 },
      show: { y: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { y: -20, opacity: 0, transition: { duration: 0.3 } },
    },
  },
  slideDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { y: -20, opacity: 0 },
      show: { y: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { y: 20, opacity: 0, transition: { duration: 0.3 } },
    },
  },
  slideLeft: {
    container: defaultContainerVariants,
    item: {
      hidden: { x: 20, opacity: 0 },
      show: { x: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { x: -20, opacity: 0, transition: { duration: 0.3 } },
    },
  },
  slideRight: {
    container: defaultContainerVariants,
    item: {
      hidden: { x: -20, opacity: 0 },
      show: { x: 0, opacity: 1, transition: { duration: 0.3 } },
      exit: { x: 20, opacity: 0, transition: { duration: 0.3 } },
    },
  },
  scaleUp: {
    container: defaultContainerVariants,
    item: {
      hidden: { scale: 0.5, opacity: 0 },
      show: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, scale: { type: 'spring', damping: 15, stiffness: 300 } },
      },
      exit: { scale: 0.5, opacity: 0, transition: { duration: 0.3 } },
    },
  },
  scaleDown: {
    container: defaultContainerVariants,
    item: {
      hidden: { scale: 1.5, opacity: 0 },
      show: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.3, scale: { type: 'spring', damping: 15, stiffness: 300 } },
      },
      exit: { scale: 1.5, opacity: 0, transition: { duration: 0.3 } },
    },
  },
}

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

type CharGroup = { startIndex: number; chars: string[] }

function groupCharacters(text: string): CharGroup[] {
  const characters = Array.from(text)
  const groups: CharGroup[] = []
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

const TextAnimateBase = ({
  children,
  delay = 0,
  duration = 0.3,
  variants,
  className,
  segmentClassName,
  as: Component = 'p',
  startOnView = true,
  once = false,
  by = 'word',
  animation = 'fadeIn',
  accessible = true,
  ...props
}: TextAnimateProps) => {
  const MotionComponent = motionElements[Component]

  let segments: string[] = []
  switch (by) {
    case 'word':
      segments = children.split(/(\s+)/)
      break
    case 'character':
      segments = Array.from(children)
      break
    case 'line':
      segments = children.split('\n')
      break
    case 'text':
    default:
      segments = [children]
      break
  }

  const step = duration / Math.max(segments.length, 1)
  // Character mode nests glyphs in nowrap words, so staggerChildren cannot see them —
  // drive delay from the glyph index on each span instead.
  const useIndexDelay = by === 'character'

  // ponytail: ship full Magic UI preset map, but only blurInUp/character is wired on the homepage.
  const preset = animation ? defaultItemAnimationVariants[animation] : null
  const finalVariants = variants
    ? {
        container: {
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: useIndexDelay
              ? { opacity: { duration: 0.01, delay } }
              : {
                  opacity: { duration: 0.01, delay },
                  delayChildren: delay,
                  staggerChildren: step,
                },
          },
          exit: {
            opacity: 0,
            transition: useIndexDelay
              ? undefined
              : { staggerChildren: step, staggerDirection: -1 },
          },
        },
        item: variants,
      }
    : preset
      ? {
          container: {
            ...preset.container,
            show: {
              ...preset.container.show,
              transition: useIndexDelay
                ? undefined
                : { delayChildren: delay, staggerChildren: step },
            },
            exit: {
              ...preset.container.exit,
              transition: useIndexDelay
                ? undefined
                : { staggerChildren: step, staggerDirection: -1 },
            },
          },
          item: preset.item,
        }
      : { container: defaultContainerVariants, item: defaultItemVariants }

  const charGroups = by === 'character' ? groupCharacters(children) : null
  const itemShow = finalVariants.item.show
  const itemHidden = finalVariants.item.hidden
  const itemShowTransition = (
    itemShow
    && typeof itemShow === 'object'
    && 'transition' in itemShow
    && itemShow.transition
    && typeof itemShow.transition === 'object'
  ) ? itemShow.transition : { duration: 0.3 }

  return (
    <AnimatePresence mode="popLayout">
      {charGroups ? (
        <MotionComponent
          className={cx(className)}
          aria-label={accessible ? children : undefined}
          style={{ display: Component === 'strong' ? 'block' : undefined } as CSSProperties}
          {...props}
        >
          {accessible && <span className="sr-only">{children}</span>}
          {charGroups.map((group) => {
            const isSpace = group.chars.length === 1 && /\s/.test(group.chars[0])
            return (
              <span
                key={group.startIndex}
                className={isSpace ? undefined : 'inline-block whitespace-nowrap'}
                style={isSpace ? { whiteSpace: 'pre' } : undefined}
              >
                {group.chars.map((segment, offset) => {
                  const i = group.startIndex + offset
                  const hiddenState = (
                    itemHidden && typeof itemHidden === 'object' && !Array.isArray(itemHidden)
                      ? itemHidden
                      : { opacity: 0, filter: 'blur(10px)', y: 20 }
                  ) as { opacity?: number; filter?: string; y?: number }
                  const showState = {
                    opacity: 1,
                    filter: 'blur(0px)',
                    y: 0,
                  }
                  return (
                    <motion.span
                      key={`${by}-${segment}-${i}`}
                      initial={hiddenState}
                      whileInView={startOnView ? showState : undefined}
                      animate={startOnView ? undefined : showState}
                      viewport={{ once }}
                      transition={{ ...itemShowTransition, delay: delay + i * step }}
                      className={cx('inline-block whitespace-pre', segmentClassName)}
                      aria-hidden={accessible ? true : undefined}
                    >
                      {segment === ' ' ? '\u00a0' : segment}
                    </motion.span>
                  )
                })}
              </span>
            )
          })}
        </MotionComponent>
      ) : (
        <MotionComponent
          variants={finalVariants.container as Variants}
          initial="hidden"
          whileInView={startOnView ? 'show' : undefined}
          animate={startOnView ? undefined : 'show'}
          exit="exit"
          className={cx(className)}
          viewport={{ once }}
          aria-label={accessible ? children : undefined}
          style={{ display: Component === 'strong' ? 'block' : undefined } as CSSProperties}
          {...props}
        >
          {accessible && <span className="sr-only">{children}</span>}
          {segments.map((segment, i) => (
            <motion.span
              key={`${by}-${segment}-${i}`}
              variants={finalVariants.item}
              custom={i * staggerTimings[by]}
              className={cx(
                by === 'line' ? 'block' : 'inline-block whitespace-pre',
                segmentClassName,
              )}
              aria-hidden={accessible ? true : undefined}
            >
              {segment === ' ' ? '\u00a0' : segment}
            </motion.span>
          ))}
        </MotionComponent>
      )}
    </AnimatePresence>
  )
}

export const TextAnimate = memo(TextAnimateBase)
