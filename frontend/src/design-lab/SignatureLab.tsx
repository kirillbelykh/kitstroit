import { Suspense, lazy, useEffect, useRef, type ReactNode } from 'react'
import { LeadForm, Reveal } from '../components'
import LabChrome, { ConfirmBadge, KitMark } from './LabChrome'
import {
  LAB_GEO,
  LAB_PHONE,
  LAB_PHONE_LINK,
  LAB_PROCESS,
  LAB_PROJECTS,
  LAB_SERVICE,
  LAB_TELEGRAM_LINK,
  LAB_TURNKEY,
} from './lab-content'
import './signature.css'

const GlassLogoMark = lazy(() => import('./GlassLogoMark'))

export type SignatureMode = 'static' | 'canvas'

function shouldEnableCanvasEffects(): boolean {
  if (typeof window === 'undefined') return false
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (matchMedia('(max-width: 768px), (pointer: coarse)').matches) return false
  const nav = navigator as Navigator & { connection?: { saveData?: boolean } }
  if (nav.connection?.saveData) return false
  if ((navigator.hardwareConcurrency || 8) <= 4) return false
  return true
}

function SoftProjectReveal({
  children,
  enabled,
  className = '',
}: {
  children: ReactNode
  enabled: boolean
  className?: string
}) {
  const ref = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.unobserve(el)
        }
      },
      { threshold: 0.18 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [enabled])

  return (
    <figure ref={ref} className={`sig__project${enabled ? ' is-reveal' : ''} ${className}`.trim()}>
      {children}
    </figure>
  )
}

function HeroPointerMedia({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    const img = el.querySelector('img')
    if (!img) return

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - rect.left) / rect.width - 0.5
      const y = (event.clientY - rect.top) / rect.height - 0.5
      img.style.transform = `scale(1.04) translate(${x * 8}px, ${y * 6}px)`
    }
    const onLeave = () => {
      img.style.transform = 'scale(1.02)'
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [enabled])

  return (
    <div className={`sig__hero-media${enabled ? ' is-live' : ''}`} ref={ref} aria-hidden="true">
      <img src="/media/hero-evening-4k.webp" alt="" fetchPriority="high" />
    </div>
  )
}

export function SignaturePage({ mode, activePath }: { mode: SignatureMode; activePath: string }) {
  const canvasOn = mode === 'canvas' && shouldEnableCanvasEffects()

  return (
    <LabChrome activePath={activePath}>
      <main className="sig" id="top">
        <section className="sig__hero" aria-label="Hero">
          <HeroPointerMedia enabled={canvasOn} />
          <div className="sig__hero-shade" aria-hidden="true" />

          <div className="sig__hero-top">
            {mode === 'canvas' ? (
              <div className="sig__glass-logo">
                <Suspense fallback={<KitMark large />}>
                  <GlassLogoMark
                    src="/design-lab/logo-glass/mark-kit.svg"
                    label="KIT glass logo"
                    size="nav"
                    theme="dark"
                  />
                </Suspense>
              </div>
            ) : (
              <KitMark large />
            )}
            <nav className="sig__hero-nav" aria-label="На странице">
              <a href="#trust">Доверие</a>
              <a href="#projects">Проекты</a>
              <a href="#lead">Заявка</a>
            </nav>
          </div>

          <div className="sig__hero-body">
            <p className="sig__eyebrow">KIT Signature · {LAB_GEO}</p>
            <h1>Загородные дома под ключ с ясной сметой и спокойной стройкой</h1>
            <p>{LAB_SERVICE}</p>
            <div className="sig__actions">
              <a className="sig__btn" href="#lead">
                Обсудить строительство
              </a>
              <a className="sig__btn sig__btn--ghost" href="#projects">
                Смотреть объекты
              </a>
            </div>
          </div>
        </section>

        <section className="sig__section sig__pad" id="trust">
          <Reveal className="sig__head">
            <p className="sig__eyebrow">Почему доверять</p>
            <h2>Атмосфера места + ремесло + понятные правила договора</h2>
          </Reveal>
          <div className="sig__trust">
            <Reveal>
              <article>
                <h3>
                  Личная ответственность
                  <ConfirmBadge />
                </h3>
                <p>
                  В материалах есть «13 лет / с 2013». Для рекламы факт требует подтверждения
                  владельцем — не выдаём его как готовое обещание.
                </p>
              </article>
            </Reveal>
            <Reveal>
              <article>
                <h3>География</h3>
                <p>Только Санкт-Петербург и Ленинградская область — один рынок, без расфокуса.</p>
              </article>
            </Reveal>
            <Reveal>
              <article>
                <h3>Гарантия 10 лет</h3>
                <p>Письменно на выполненные работы. Остаёмся на связи после передачи дома.</p>
              </article>
            </Reveal>
          </div>
        </section>

        <section className="sig__section sig__section--sand sig__pad" id="projects">
          <Reveal className="sig__head">
            <p className="sig__eyebrow">Реализованные объекты</p>
            <h2>Что уже построено — и что пока концепция</h2>
          </Reveal>
          <div className="sig__projects">
            {LAB_PROJECTS.map((project, index) => (
              <SoftProjectReveal
                key={project.title}
                enabled={canvasOn && index === 0}
                className={index === 0 ? 'sig__project--tall' : ''}
              >
                <img src={project.image} alt={project.title} loading="lazy" />
                <figcaption>
                  <strong>{project.title}</strong>
                  {project.place} · {project.status}
                </figcaption>
              </SoftProjectReveal>
            ))}
          </div>
        </section>

        <section className="sig__section sig__pad" id="turnkey">
          <Reveal className="sig__head">
            <p className="sig__eyebrow">Под ключ</p>
            <h2>Что значит «под ключ» для KIT</h2>
            <p>Фиксируем стоимость, этапы и ответственность до начала соответствующих работ.</p>
          </Reveal>
          <div className="sig__specs">
            {LAB_TURNKEY.map((item, index) => (
              <Reveal key={item.title}>
                <article>
                  <span>0{index + 1}</span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="sig__section sig__section--ink sig__pad" id="process">
          <Reveal className="sig__head">
            <p className="sig__eyebrow">Процесс</p>
            <h2>Как идём от участка к ключам</h2>
          </Reveal>
          <div className="sig__process">
            {LAB_PROCESS.map((step, index) => (
              <Reveal key={step.title}>
                <article>
                  <span>0{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="sig__section sig__pad" id="founder">
          <div className="sig__founder">
            <Reveal>
              <img src="/media/founder.jpg" alt="Никита Савин" loading="lazy" />
            </Reveal>
            <Reveal>
              <p className="sig__eyebrow">Кто отвечает</p>
              <h2>Никита Савин, основатель</h2>
              <p>
                Лично знакомится с проектом и остаётся на связи до передачи ключей и после неё.
                Для него хороший дом — точная система повседневной жизни, а не эффектная картинка.
              </p>
              <div className="sig__actions">
                <a className="sig__btn sig__btn--dark" href="#lead">
                  Обсудить строительство
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="sig__section sig__section--ink sig__pad" id="lead">
          <div className="sig__lead">
            <Reveal>
              <p className="sig__eyebrow">Как начать</p>
              <h2>Расскажите о участке и задаче — ответим в рабочее время</h2>
              <p>
                {LAB_GEO}. <a href={LAB_PHONE_LINK}>{LAB_PHONE}</a>
                {' · '}
                <a href={LAB_TELEGRAM_LINK} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              </p>
            </Reveal>
            <Reveal>
              <LeadForm />
            </Reveal>
          </div>
        </section>

        <footer className="sig__foot">
          KIT Signature{mode === 'canvas' ? ' + Canvas' : ''} · experimental · production Header не
          изменён
        </footer>
      </main>
    </LabChrome>
  )
}

export default function SignatureLab() {
  return <SignaturePage mode="static" activePath="/design-lab/signature" />
}
