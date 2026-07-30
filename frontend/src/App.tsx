import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { BorderBeam } from 'border-beam'
import { Arrow, LeadForm, MediaImage, PHONE_DISPLAY, PHONE_LINK, Reveal } from './components'
import { IconSwap } from './components/IconSwap'
import { NumberPopIn } from './components/NumberPopIn'
import { StaggerReveal } from './components/StaggerReveal'
import { TiltCard } from './components/TiltCard'
import { api } from './api'
import { setPendingCta, trackCtaClick, trackFaqOpen, trackPhoneClick, trackProjectOpen, trackTelegramClick, trackVideoStart } from './analytics'

function onPhoneClick() {
  trackPhoneClick()
}

function onTelegramClick() {
  trackTelegramClick()
}

function onCtaClick(cta: string) {
  return () => {
    setPendingCta(cta)
    trackCtaClick(cta)
  }
}

type ContentSection = { key: string; eyebrow?: string; title?: string; body?: string; cta_label?: string; cta_url?: string; enabled?: boolean }
type PublicProject = { id?: number; slug?: string; title: string; summary?: string; location?: string; area?: string | number; cover_url?: string; published?: boolean; media?: { url: string }[] }
type PublicContent = { settings: Record<string, string>; sections: ContentSection[]; projects: PublicProject[]; telegram_username?: string }
type Project = { title: string; place: string; area: string; status?: string; summary: string; media: string[]; plan: 'line' | 'courtyard' | 'compact' }

const MEDIA_CACHE_VERSION = '20260730b'
const withMediaVersion = (url: string) => {
  if (!url.startsWith('/media/')) return url
  const join = url.includes('?') ? '&' : '?'
  return `${url}${join}v=${MEDIA_CACHE_VERSION}`
}

const fallbackProjects: Project[] = [
  {
    title: 'Северный сад', place: 'Всеволожский район', area: '186 м²', plan: 'line',
    summary: 'Одноэтажный каркасный дом с длинной террасой, общей гостиной и приватным крылом для семьи.',
    media: ['/media/generated/project-forest.webp', '/media/project-cabin.jpg', '/media/generated/project-interior.webp'],
  },
  {
    title: 'Дом у воды', place: 'Ленинградская область', area: '214 м²', plan: 'courtyard',
    summary: 'Дом раскрывается к воде: панорамная гостиная, защищённый внутренний двор и тёплый свет дерева.',
    media: ['/media/project-lake.jpg', '/media/interior-4k.webp', '/media/project-courtyard.jpg'],
  },
  {
    title: 'Тихая терраса', place: 'Репино', area: '164 м²', plan: 'compact',
    summary: 'Компактный дом для постоянной жизни — без лишних коридоров, но с воздухом, светом и садом в каждом окне.',
    media: ['/media/project-cabin.jpg', '/media/generated/project-interior.webp', '/media/hero-wood-4k.webp'],
  },
]

const videoReviews = [
  ['Павлов SKY · обзор дома', '/media/reviews/pavlov-sky-overview.mp4?v=1080p60', '/media/projects/pavlov-sky/img-2085.webp'],
] as const

const steps = [
  ['01', 'Знакомство и задача', 'Выезжаем на участок или в квартиру. Собираем сценарии жизни, ограничения и приоритеты — без лишнего объёма работ.', '/media/process-nikita.webp?v=20260727'],
  ['02', 'Проект и смета', 'Согласуем решения, материалы, объём работ, стоимость и календарный план. Всё фиксируем до старта.', '/media/reviews/architectural-blueprints.mp4'],
  ['03', 'Строительство и отделка', 'Закреплённый ответственный и постоянная команда. Фотоотчёты, акты скрытых работ и контроль каждого этапа.', '/media/generated/process-frame.webp'],
  ['04', 'Сдача объекта', 'Проверяем результат, устраняем замечания и передаём дом или квартиру с комплектом документов.', '/media/projects/pavlov-sky/img-2085.webp'],
] as const

const TELEGRAM_CHANNEL = 'https://t.me/kitstroit/15'
const MAX_CHANNEL = 'https://6max.ru/kit_stroit'

const advantages = [
  ['Фиксированная смета', 'Стоимость и состав работ закрепляем в договоре. Без скрытых платежей и внезапных доплат.'],
  ['Поэтапная оплата', 'Вы оплачиваете выполненные и принятые этапы, а не обещания будущего результата.'],
  ['Контроль работ', 'Календарный план, фотоотчёты и акты на скрытые работы — ход стройки и отделки виден на каждом этапе.'],
  ['Один ответственный подрядчик', 'Один договор, одна команда и личная ответственность до передачи объекта.'],
] as const

const faqs = [
  ['Можно ли работать по нашему проекту?', 'Да. Проверим проект дома или дизайн-проект квартиры, адаптируем к условиям объекта. Если проекта нет — поможем подготовить решения с нуля.'],
  ['Смета действительно не меняется?', 'Стоимость и состав работ фиксируем в договоре. Изменения возможны только по вашему решению и оформляются отдельным соглашением.'],
  ['Как контролировать ход работ?', 'У вас будет календарный план, закреплённый ответственный и регулярные фотоотчёты. Скрытые работы принимаются по актам.'],
  ['Какая гарантия на работы?', 'Даём письменную гарантию 10 лет на выполненные работы и остаёмся на связи после сдачи дома или квартиры.'],
]

function Header({ phone, phoneLink }: { phone: string; phoneLink: string }) {
  const [open, setOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    const backgroundElements = Array.from(document.querySelectorAll<HTMLElement>('.skip-link, .site > main, .site > footer, .mobile-cta'))
    const previousInert = backgroundElements.map((element) => element.inert)
    document.body.style.overflow = 'hidden'
    backgroundElements.forEach((element) => { element.inert = true })
    navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpen(false)
      menuButtonRef.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      backgroundElements.forEach((element, index) => { element.inert = previousInert[index] })
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  return <header className={open ? 'site-header menu-open' : 'site-header'}>
    <button ref={menuButtonRef} className="menu-button" type="button" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}>
      <IconSwap
        state={open ? 'b' : 'a'}
        iconA={<span className="menu-icon-bars" aria-hidden="true"><i /><i /><i /></span>}
        iconB={<span className="menu-icon-close" aria-hidden="true"><i /><i /></span>}
      />
      <span className="sr-only">Меню</span>
    </button>
    <nav ref={navRef} id="main-menu" className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Главная навигация">
      <div><a href="#projects" onClick={() => setOpen(false)}>Проекты</a><a href="#founder" onClick={() => setOpen(false)}>Основатель</a></div>
      <div><a href="#videos" onClick={() => setOpen(false)}>Видео</a><a href="#process" onClick={() => setOpen(false)}>Как работаем</a></div>
    </nav>
    <BorderBeam className="header-logo-beam" borderRadius={0} colorVariant="mono" theme="dark" size="sm" strength={0.65}>
      <a className="logo header-logo" href="#top" aria-label="KIT — на главную"><span>K</span><span>I</span><span>T</span></a>
    </BorderBeam>
    <a className="header-phone" href={phoneLink} onClick={onPhoneClick}>{phone}</a>
  </header>
}

const LIGHTBOX_MIN_SCALE = 1
const LIGHTBOX_MAX_SCALE = 3
const LIGHTBOX_DOUBLE_TAP_SCALE = 2.25

function ProjectLightbox({ title, media, index, onClose, onMove }: { title: string; media: string[]; index: number; onClose: () => void; onMove: (direction: number) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const onMoveRef = useRef(onMove)
  const scaleRef = useRef(1)
  const translateRef = useRef({ x: 0, y: 0 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; scale: number } | null>(null)
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const lastTapRef = useRef(0)
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  onCloseRef.current = onClose
  onMoveRef.current = onMove

  function applyTransform(scale: number, x: number, y: number) {
    scaleRef.current = scale
    translateRef.current = { x, y }
    setTransform({ scale, x, y })
  }

  function resetZoom() {
    applyTransform(1, 0, 0)
  }

  useEffect(() => {
    resetZoom()
  }, [index])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousPosition = document.body.style.position
    const previousTop = document.body.style.top
    const previousWidth = document.body.style.width
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
      if (event.key === 'ArrowLeft') onMoveRef.current(-1)
      if (event.key === 'ArrowRight') onMoveRef.current(1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.position = previousPosition
      document.body.style.top = previousTop
      document.body.style.width = previousWidth
      const root = document.documentElement
      const previousScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'
      window.scrollTo(0, scrollY)
      root.style.scrollBehavior = previousScrollBehavior
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  function pointerDistance() {
    const points = [...pointersRef.current.values()]
    if (points.length < 2) return 0
    const [a, b] = points
    return Math.hypot(b.x - a.x, b.y - a.y)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    stageRef.current?.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size === 2) {
      swipeRef.current = null
      panRef.current = null
      pinchRef.current = { distance: pointerDistance(), scale: scaleRef.current }
      return
    }

    if (scaleRef.current > 1.02) {
      panRef.current = {
        x: event.clientX,
        y: event.clientY,
        tx: translateRef.current.x,
        ty: translateRef.current.y,
      }
      swipeRef.current = null
    } else {
      swipeRef.current = { x: event.clientX, y: event.clientY }
      panRef.current = null
    }

    const now = performance.now()
    if (now - lastTapRef.current < 280 && pointersRef.current.size === 1) {
      lastTapRef.current = 0
      swipeRef.current = null
      panRef.current = null
      if (scaleRef.current > 1.05) resetZoom()
      else applyTransform(LIGHTBOX_DOUBLE_TAP_SCALE, 0, 0)
      return
    }
    lastTapRef.current = now
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(event.pointerId)) return
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const distance = pointerDistance()
      if (distance < 1 || pinchRef.current.distance < 1) return
      const next = Math.min(
        LIGHTBOX_MAX_SCALE,
        Math.max(LIGHTBOX_MIN_SCALE, pinchRef.current.scale * (distance / pinchRef.current.distance)),
      )
      const { x, y } = translateRef.current
      applyTransform(next, next <= 1.02 ? 0 : x, next <= 1.02 ? 0 : y)
      return
    }

    if (panRef.current && scaleRef.current > 1.02) {
      applyTransform(
        scaleRef.current,
        panRef.current.tx + (event.clientX - panRef.current.x),
        panRef.current.ty + (event.clientY - panRef.current.y),
      )
    }
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current = null
    if (pointersRef.current.size === 0) {
      if (swipeRef.current && scaleRef.current <= 1.02) {
        const dx = event.clientX - swipeRef.current.x
        const dy = event.clientY - swipeRef.current.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) >= Math.abs(dy) * 1.1) {
          onMove(dx < 0 ? 1 : -1)
        }
      }
      swipeRef.current = null
      panRef.current = null
      if (scaleRef.current <= 1.02) resetZoom()
    }
  }

  return createPortal(
    <div
      className="project-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, просмотр фото`}
    >
      <button ref={closeRef} className="project-lightbox-close" type="button" aria-label="Закрыть" onClick={onClose}>×</button>
      <button className="project-lightbox-nav project-lightbox-prev" type="button" aria-label="Предыдущий кадр" onClick={() => onMove(-1)}>←</button>
      <div
        ref={stageRef}
        className="project-lightbox-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          className="project-lightbox-image"
          key={media[index]}
          src={media[index]}
          alt={`${title}, кадр ${index + 1}`}
          draggable={false}
          style={{
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
            touchAction: 'none',
          }}
        />
      </div>
      <button className="project-lightbox-nav project-lightbox-next" type="button" aria-label="Следующий кадр" onClick={() => onMove(1)}>→</button>
      <p className="project-lightbox-meta">{String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</p>
    </div>,
    document.body,
  )
}

function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <Reveal delay={index * 50}>
      <details
        onToggle={(event) => {
          const isOpen = event.currentTarget.open
          setOpen(isOpen)
          if (isOpen) trackFaqOpen(question, index + 1)
        }}
      >
        <summary><span>0{index + 1}</span>{question}<i>+</i></summary>
        <StaggerReveal open={open} text={answer} />
      </details>
    </Reveal>
  )
}

function ProjectMagazine({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState(0)
  const [activeMedia, setActiveMedia] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const ignoreOpenClickRef = useRef(false)
  const project = projects[activeProject]
  const selectProject = (index: number) => {
    setActiveProject(index)
    setActiveMedia(0)
    setLightboxOpen(false)
    trackProjectOpen(index)
  }
  const move = (direction: number) => setActiveMedia((current) => (current + direction + project.media.length) % project.media.length)
  const onGalleryPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    swipeRef.current = { x: event.clientX, y: event.clientY }
  }
  const onGalleryPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!swipeRef.current) return
    const dx = event.clientX - swipeRef.current.x
    const dy = event.clientY - swipeRef.current.y
    swipeRef.current = null
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.15) return
    ignoreOpenClickRef.current = true
    move(dx < 0 ? 1 : -1)
  }
  const openLightbox = () => {
    if (ignoreOpenClickRef.current) {
      ignoreOpenClickRef.current = false
      return
    }
    setLightboxOpen(true)
  }
  return <section id="projects" className="projects section-ink">
    <Reveal className="section-head"><p className="section-index">[ 02 — проекты ]</p><h2>Представляем<br /><em>наши проекты</em></h2></Reveal>
    <nav className="project-tabs" aria-label="Проекты">{projects.map((item, index) => <button key={item.title} aria-pressed={index === activeProject} onClick={() => selectProject(index)}><span>0{index + 1}</span>{item.title}</button>)}</nav>
    <div className="magazine">
      <div
        className="magazine-media"
        onPointerDown={onGalleryPointerDown}
        onPointerUp={onGalleryPointerUp}
        onPointerCancel={() => { swipeRef.current = null }}
      >
        <TiltCard className="magazine-tilt">
          <button className="magazine-open" type="button" onClick={openLightbox} aria-label={`Открыть фото ${project.title} на весь экран`}>
            <img className="magazine-image" key={project.media[activeMedia]} src={project.media[activeMedia]} alt={`${project.title}, кадр ${activeMedia + 1}`} />
            <span className="magazine-open-hint" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square">
                <path d="M9 3H3v6M15 3h6v6M9 21H3v-6M21 15v6h-6" />
              </svg>
            </span>
          </button>
        </TiltCard>
        <div className="magazine-controls" onPointerDown={(event) => event.stopPropagation()}>
          <button type="button" className="magazine-prev" aria-label="Предыдущий кадр" onClick={() => move(-1)}>←</button>
          <span>{String(activeMedia + 1).padStart(2, '0')} / {String(project.media.length).padStart(2, '0')}</span>
          <button type="button" className="magazine-next" aria-label="Следующий кадр" onClick={() => move(1)}>→</button>
        </div>
      </div>
      <div className="magazine-copy">
        <p className="section-index">{project.place}</p><h3>{project.title}</h3>
        <dl><div><dt>Площадь</dt><dd><NumberPopIn value={project.area} /></dd></div><div><dt>Статус</dt><dd>{project.status || 'Концепция'}</dd></div><div><dt>Гарантия</dt><dd>10 лет</dd></div></dl>
        <a className="text-arrow" href="#lead" onClick={onCtaClick('project_discuss')}>Обсудить похожий проект <Arrow diagonal /></a>
      </div>
    </div>
    {lightboxOpen && <ProjectLightbox title={project.title} media={project.media} index={activeMedia} onClose={() => setLightboxOpen(false)} onMove={move} />}
  </section>
}

function VideoReviews() {
  const [title, src, poster] = videoReviews[0]
  return <section id="videos" className="videos section-ink">
    <Reveal className="section-head"><p className="section-index">[ 03 — видео ]</p><h2>Видео наших работ</h2></Reveal>
    <div className="video-grid video-grid-single"><Reveal className="video-card" delay={0}><video aria-label={title} controls preload="metadata" playsInline poster={poster} src={src} onPlay={(event) => {
      const el = event.currentTarget
      if (el.dataset.ymTracked === '1') return
      el.dataset.ymTracked = '1'
      trackVideoStart(title)
    }} /><div><span>01</span><h3>{title}</h3></div></Reveal></div>
  </section>
}

function ProcessTitle({ title }: { title?: string }) {
  if (!title) return <>Система,<br />а не <em>импровизация.</em></>
  const match = title.match(/^(.*?)\s*,?\s*а не\s+(.+)$/i)
  if (!match) return <>{title}</>
  const lead = match[1].replace(/,$/, '').trim()
  const accent = match[2].replace(/\.$/, '').trim()
  return <>{lead},<br />а не <em>{accent}.</em></>
}

function ProcessSection({ eyebrow, title, body }: { eyebrow?: string; title?: string; body?: string }) {
  return <section id="process" className="process section-light">
    <Reveal className="section-head">
      <p className="section-index">{eyebrow || '[ 04 — процесс ]'}</p>
      <h2><ProcessTitle title={title} /></h2>
      <p>{body || 'Дом или квартира → проект и смета → работы и контроль → сдача. Каждый этап имеет результат и точку приёмки.'}</p>
    </Reveal>
    <div className="process-cards">
      {steps.map(([number, stepTitle, text, media], index) => (
        <Reveal className="process-card" key={number} delay={index * 70}>
          <div className="process-media">
            {media.endsWith('.mp4')
              ? <video src={media} muted autoPlay loop playsInline aria-hidden="true" />
              : <img src={media} alt="" loading="lazy" />}
          </div>
          <div className="process-copy">
            <span className="process-index">{number}</span>
            <h3>{stepTitle}</h3>
            <p>{text}</p>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
}

function App() {
  const [content, setContent] = useState<PublicContent | null>(null)
  const [showMobileCta, setShowMobileCta] = useState(false)
  const heroRef = useRef<HTMLElement>(null)
  useEffect(() => { api<PublicContent>('/content').then(setContent).catch(() => undefined) }, [])
  useEffect(() => {
    const heroElement = heroRef.current
    if (!heroElement) return
    const observer = new IntersectionObserver(([entry]) => setShowMobileCta(!entry.isIntersecting), { threshold: .05 })
    observer.observe(heroElement)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!window.location.hash) return
    const frame = requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [content])
  const section = (key: string) => content?.sections.find((item) => item.key === key && item.enabled !== false)
  const hero = section('hero')
  const founder = section('founder')
  const process = section('process')
  const guarantee = section('guarantee')
  const lead = section('lead')
  const contacts = section('contacts')
  const heroTitle = !hero?.title || /строительство домов под ключ/i.test(hero.title) ? 'Точное соответствие вашим потребностям.' : hero.title
  const heroBody = !hero?.body || /Продумываем проект|единую систему/i.test(hero.body)
    ? 'Строительство домов и отделка квартир под ключ с 2013 года'
    : hero.body
  const processBody = process?.body && !/Участок и задача/i.test(process.body)
    ? process.body
    : 'Дом или квартира → проект и смета → работы и контроль → сдача. Каждый этап имеет результат и точку приёмки.'
  const publicProjects = content?.projects.filter((project) => project.published !== false && project.slug !== 'familia') ?? []
  const projects = useMemo<Project[]>(() => publicProjects.length ? publicProjects.map((project, index) => {
    const fallback = fallbackProjects[index % fallbackProjects.length]
    const gallery = [project.cover_url, ...(project.media?.map((item) => item.url) || [])]
      .filter((url): url is string => Boolean(url))
      .map(withMediaVersion)
    return {
      title: project.title,
      place: project.location || 'Санкт-Петербург и ЛО',
      area: project.area ? `${project.area} м²` : '—',
      status: ['pavlov-sky', 'dom-bezobrazova-repino', 'olimpiyskaya', 'suzdalskoe-12'].includes(project.slug || '') ? 'Готовый объект' : 'Концепция',
      summary: '',
      media: [...new Set(gallery.length ? gallery : fallback.media)],
      plan: fallback.plan,
    }
  }) : fallbackProjects.map((project) => ({ ...project, summary: '' })), [publicProjects])
  const phone = content?.settings.phone || content?.settings.phone_display || PHONE_DISPLAY
  const phoneLink = content?.settings.phone_href || `tel:${phone.replace(/\D/g, '').replace(/^8/, '+7')}` || PHONE_LINK
  const telegramLink = TELEGRAM_CHANNEL
  const telegramLabel = '@kitstroit'
  const email = content?.settings.email || 'info@kitstroit.ru'
  const discussCta = hero?.cta_label || 'Обсудить строительство'
  const founderBody = founder?.body || 'Я лично знакомлюсь с каждым проектом и остаюсь на связи до передачи ключей и после неё. Для меня хороший результат — не эффектная картинка, а точная система, которая каждый день делает жизнь семьи проще.'
  return <div className="site" id="top">
    <a className="skip-link" href="#main-content">Перейти к содержанию</a>
    <Header phone={phone} phoneLink={phoneLink} />
    <main id="main-content">
      <section ref={heroRef} className="hero" aria-label="Строительство домов и отделка квартир под ключ">
        <div className="hero-media" aria-hidden="true">
          <div className="hero-slide hero-slide-one" />
          <div className="hero-slide hero-slide-two" />
          <div className="hero-slide hero-slide-three" />
          <div className="hero-slide hero-slide-four hero-slide-mobile" />
          <div className="hero-slide hero-slide-five hero-slide-mobile" />
        </div>
        <div className="hero-topline"><span>Санкт-Петербург</span><span>59.9343° N</span><span>Ленинградская область</span></div>
        <div className="hero-content"><h1 className="hero-title"><span className="t-shimmer" data-text={heroTitle}>{heroTitle}</span></h1><div className="hero-bottom"><p>{heroBody}</p><div className="hero-actions"><a className="button button-light" href={hero?.cta_url || '#lead'} onClick={onCtaClick('hero_calculate')}>{discussCta} <Arrow diagonal /></a><a className="text-link" href={phoneLink} onClick={onPhoneClick}>Позвонить <span>{phone}</span></a></div></div></div>
        <a className="scroll-mark" href="#founder"><span>Листайте</span><i /></a>
      </section>

      <section id="founder" className="founder section-light">
        <div className="founder-intro"><p className="section-index">{founder?.eyebrow || '[ 01 — знакомство ]'}</p><h2>За каждым домом<br />стоит <em>личная ответственность.</em></h2></div>
        <div className="founder-media"><MediaImage src="/media/founder.jpg?v=20260726" alt="Савин Никита, основатель компании KIT" /><span className="founder-tag">Основатель KIT · Савин Никита</span></div>
        <Reveal className="founder-copy"><h3>Никита Савин <span>основатель компании</span></h3><p>{founderBody}</p><p>Отец четверых детей, живу за городом и хорошо понимаю цену удобной планировки, спокойной стройки и решений, о которых не приходится жалеть.</p><a className="text-arrow" href={founder?.cta_url || '#lead'} onClick={onCtaClick('founder_discuss')}>{founder?.cta_label || 'Обсудить дом с Никитой'} <Arrow diagonal /></a></Reveal>
      </section>

      <ProjectMagazine projects={projects} />
      <VideoReviews />
      <ProcessSection eyebrow={process?.eyebrow} title={process?.title} body={processBody} />

      <section className="proof section-light grid-lines"><Reveal className="proof-intro"><p className="section-index">[ 05 — преимущества ]</p><h2>Красиво — значит ещё и <em>предсказуемо.</em></h2></Reveal><div className="proof-grid">{advantages.map(([title, text], i) => <Reveal key={title} className={`metric${title === 'Поэтапная оплата' ? ' metric-accent' : ''}`} delay={i * 60}><span className="metric-index">0{i + 1}</span><strong>{title}</strong><p>{text}</p></Reveal>)}</div></section>

      <section className="guarantees section-ink grid-lines"><Reveal className="section-head"><p className="section-index">{guarantee?.eyebrow || '[ 06 — договор ]'}</p><h2>{guarantee?.title || <>Не мелкий шрифт.<br /><em>А ясные правила.</em></>}</h2></Reveal><div className="guarantee-layout"><Reveal className="guarantee-big"><strong>10</strong><span>лет<br />гарантии</span><p>{guarantee?.body || 'Письменно. На все выполненные работы.'}</p></Reveal><div className="guarantee-list">{[['Цена', 'Смета фиксируется в договоре. Без скрытых платежей.'], ['Сроки', 'Поэтапный календарный план и ответственность сторон.'], ['Контроль', 'Фотоотчёты и акты на скрытые работы.'], ['Команда', 'Закреплённый прораб и свои мастера.']].map(([title, text], i) => <Reveal className="guarantee-item" key={title} delay={i * 60}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>

      <section className="faq section-light grid-lines"><Reveal className="section-head"><p className="section-index">[ 07 — коротко о важном ]</p><h2>Частые<br /><em>вопросы.</em></h2></Reveal><div className="faq-list">{faqs.map(([question, answer], i) => <FaqItem key={question} question={question} answer={answer} index={i} />)}</div></section>

      <section id="lead" className="lead section-brass grid-lines"><Reveal className="lead-copy"><p className="section-index">{lead?.eyebrow || '[ 08 — первый шаг ]'}</p><h2>{lead?.title || <>Начнём с вашей <em>задачи.</em></>}</h2><p>{lead?.body || 'Оставьте номер — перезвоним, уточним дом или квартиру и сориентируем по срокам и бюджету.'}</p></Reveal><Reveal className="lead-form-wrap"><LeadForm /></Reveal></section>

      <section id="contacts" className="contacts section-ink"><p className="section-index">{contacts?.eyebrow || '[ прямой контакт ]'}</p><a className="contact-phone" href={phoneLink} onClick={onPhoneClick}>{phone} <Arrow diagonal /></a><div className="contacts-grid"><a href={telegramLink} target="_blank" rel="noreferrer" onClick={onTelegramClick}><span>Telegram</span>{telegramLabel}</a><a href={MAX_CHANNEL} target="_blank" rel="noreferrer"><span>Max</span>kit_stroit</a><a href={`mailto:${email}`}><span>Email</span>{email}</a><p><span>Часы работы</span>{content?.settings.work_hours || 'Ежедневно · 09:00–21:00'}</p><p><span>География</span>{content?.settings.region || 'Санкт-Петербург и ЛО'}</p></div></section>
    </main>
    <footer><a className="logo" href="#top"><span>K</span><span>I</span><span>T</span></a><p>Строительство домов и отделка квартир под ключ<br />в Санкт-Петербурге и Ленинградской области</p><p>© 2026 KIT. Все права защищены.</p><div className="footer-links"><a href={telegramLink} target="_blank" rel="noreferrer" onClick={onTelegramClick}>Telegram</a><a href={MAX_CHANNEL} target="_blank" rel="noreferrer">Max</a><a href="/privacy">Политика конфиденциальности</a></div></footer>
    <div className={`mobile-cta${showMobileCta ? ' is-visible' : ''}`}><a href={phoneLink} onClick={onPhoneClick}>Позвонить</a><a href={hero?.cta_url || '#lead'} onClick={onCtaClick('mobile_calculate')}>{discussCta} <Arrow diagonal /></a></div>
  </div>
}

export default App
