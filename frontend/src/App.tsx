import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Arrow, LeadForm, MediaImage, PHONE_DISPLAY, PHONE_LINK, Reveal } from './components'
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

const MEDIA_CACHE_VERSION = '20260726c'
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
  ['01', 'Знакомство и участок', 'Выезжаем, изучаем рельеф и коммуникации. Собираем ваши сценарии жизни, а не список комнат.', '/media/founder.jpg?v=20260726'],
  ['02', 'Архитектура и смета', 'Фиксируем планировку, материалы, инженерные решения, стоимость и календарный план.', '/media/reviews/architectural-blueprints.mp4'],
  ['03', 'Строительство', 'Один прораб и постоянная команда. Фотоотчёты, акты скрытых работ и контроль каждого этапа.', '/media/generated/process-frame.webp'],
  ['04', 'Передача дома', 'Проверяем системы, устраняем замечания и передаём готовый дом с комплектом документов.', '/media/generated/project-forest.webp'],
] as const

const advantages = [
  ['Фиксированная смета', 'Стоимость и состав работ закрепляем в договоре. Без скрытых платежей и внезапных доплат.'],
  ['Поэтапная оплата', 'Вы оплачиваете выполненные и принятые этапы, а не обещания будущего результата.'],
  ['Контроль строительства', 'Календарный план, фотоотчёты и акты на скрытые работы — вы видите ход стройки.'],
  ['Один ответственный подрядчик', 'Один договор, одна команда и личная ответственность до передачи ключей.'],
] as const

const faqs = [
  ['Можно ли построить по нашему проекту?', 'Да. Проверим готовый проект, адаптируем его к участку и инженерным условиям. Если проекта нет — разработаем с нуля.'],
  ['Смета действительно не меняется?', 'Стоимость и состав работ фиксируем в договоре. Изменения возможны только по вашему решению и оформляются отдельным соглашением.'],
  ['Как контролировать стройку?', 'У вас будет календарный план, закреплённый прораб и регулярные фотоотчёты. Скрытые работы принимаются по актам.'],
  ['Какая гарантия на дом?', 'Даём письменную гарантию 10 лет на выполненные работы и остаёмся на связи после передачи дома.'],
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
    <button ref={menuButtonRef} className="menu-button" aria-label={open ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}><span /><span /><span className="sr-only">Меню</span></button>
    <nav ref={navRef} id="main-menu" className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Главная навигация">
      <div><a href="#projects" onClick={() => setOpen(false)}>Проекты</a><a href="#founder" onClick={() => setOpen(false)}>Основатель</a></div>
      <div><a href="#videos" onClick={() => setOpen(false)}>Видео</a><a href="#process" onClick={() => setOpen(false)}>Как строим</a></div>
    </nav>
    <a className="logo header-logo" href="#top" aria-label="KIT — на главную"><span>K</span><span>I</span><span>T</span></a>
    <a className="header-phone" href={phoneLink} onClick={onPhoneClick}>{phone}</a>
  </header>
}

function ProjectPlan({ variant }: { variant: Project['plan'] }) {
  const rooms = variant === 'courtyard'
    ? [[8, 8, 36, 42], [48, 8, 44, 25], [48, 37, 20, 36], [72, 37, 20, 36], [8, 54, 36, 19]]
    : variant === 'compact'
      ? [[8, 8, 27, 31], [39, 8, 53, 31], [8, 43, 27, 30], [39, 43, 28, 30], [71, 43, 21, 30]]
      : [[8, 8, 20, 65], [32, 8, 36, 65], [72, 8, 20, 30], [72, 42, 20, 31]]
  return <svg className="project-plan" viewBox="0 0 100 81" role="img" aria-label="Концептуальная схема планировки">
    <rect x="4" y="4" width="92" height="73" />
    {rooms.map(([x, y, w, h], i) => <g key={i}><rect x={x} y={y} width={w} height={h} /><line x1={x + w / 2} y1={y + h} x2={x + w / 2} y2={y + h - 4} /></g>)}
    <line x1="4" y1="79" x2="96" y2="79" /><line x1="4" y1="77" x2="4" y2="81" /><line x1="96" y1="77" x2="96" y2="81" />
  </svg>
}

function ProjectLightbox({ title, media, index, onClose, onMove }: { title: string; media: string[]; index: number; onClose: () => void; onMove: (direction: number) => void }) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const onMoveRef = useRef(onMove)
  onCloseRef.current = onClose
  onMoveRef.current = onMove

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
      window.scrollTo(0, scrollY)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return createPortal(
    <div
      className="project-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title}, просмотр фото`}
      onTouchStart={(event) => {
        const touch = event.changedTouches[0]
        touchStart.current = { x: touch.clientX, y: touch.clientY }
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return
        const touch = event.changedTouches[0]
        const dx = touch.clientX - touchStart.current.x
        const dy = touch.clientY - touchStart.current.y
        touchStart.current = null
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.1) return
        onMove(dx < 0 ? 1 : -1)
      }}
    >
      <button ref={closeRef} className="project-lightbox-close" type="button" aria-label="Закрыть" onClick={onClose}>×</button>
      <button className="project-lightbox-nav project-lightbox-prev" type="button" aria-label="Предыдущий кадр" onClick={() => onMove(-1)}>←</button>
      <div className="project-lightbox-stage">
        <img
          className="project-lightbox-image"
          key={media[index]}
          src={media[index]}
          alt={`${title}, кадр ${index + 1}`}
          draggable={false}
        />
      </div>
      <button className="project-lightbox-nav project-lightbox-next" type="button" aria-label="Следующий кадр" onClick={() => onMove(1)}>→</button>
      <p className="project-lightbox-meta">{String(index + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}</p>
    </div>,
    document.body,
  )
}

function ProjectMagazine({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState(0)
  const [activeMedia, setActiveMedia] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const project = projects[activeProject]
  const selectProject = (index: number) => {
    setActiveProject(index)
    setActiveMedia(0)
    setLightboxOpen(false)
    trackProjectOpen(index)
  }
  const move = (direction: number) => setActiveMedia((current) => (current + direction + project.media.length) % project.media.length)
  return <section id="projects" className="projects section-ink">
    <Reveal className="section-head"><p className="section-index">[ 02 — проекты ]</p><h2>Представляем<br /><em>наши проекты</em></h2><p>Каждый проект — история места, семьи и точных решений. Выберите дом и откройте его как журнал.</p></Reveal>
    <nav className="project-tabs" aria-label="Проекты">{projects.map((item, index) => <button key={item.title} aria-pressed={index === activeProject} onClick={() => selectProject(index)}><span>0{index + 1}</span>{item.title}</button>)}</nav>
    <div className="magazine">
      <div className="magazine-media">
        <img className="magazine-backdrop" src={project.media[activeMedia]} alt="" aria-hidden="true" />
        <button className="magazine-open" type="button" onClick={() => setLightboxOpen(true)} aria-label={`Открыть фото ${project.title} на весь экран`}>
          <img className="magazine-image" key={project.media[activeMedia]} src={project.media[activeMedia]} alt={`${project.title}, кадр ${activeMedia + 1}`} />
          <span className="magazine-open-hint">На весь экран</span>
        </button>
        <div className="magazine-controls"><button aria-label="Предыдущий кадр" onClick={() => move(-1)}>←</button><span>{String(activeMedia + 1).padStart(2, '0')} / {String(project.media.length).padStart(2, '0')}</span><button aria-label="Следующий кадр" onClick={() => move(1)}>→</button></div>
      </div>
      <div className="magazine-copy">
        <p className="section-index">{project.place}</p><h3>{project.title}</h3><p>{project.summary}</p>
        <dl><div><dt>Площадь</dt><dd>{project.area}</dd></div><div><dt>Статус</dt><dd>{project.status || 'Концепция'}</dd></div><div><dt>Гарантия</dt><dd>10 лет</dd></div></dl>
        <a className="text-arrow" href="#lead" onClick={onCtaClick('project_discuss')}>Обсудить похожий дом <Arrow diagonal /></a>
      </div>
    </div>
    <div className="plan-spread"><div><p className="section-index">[ планировочное решение ]</p><h3>Сначала — <em>как вы живёте.</em><br />Потом — как выглядит дом.</h3><p>Схема временная и показывает логику подачи. Для реального проекта публикуем планы, фасады и ключевые узлы.</p></div><ProjectPlan variant={project.plan} /></div>
    {lightboxOpen && <ProjectLightbox title={project.title} media={project.media} index={activeMedia} onClose={() => setLightboxOpen(false)} onMove={move} />}
  </section>
}

function VideoReviews() {
  const [title, src, poster] = videoReviews[0]
  return <section id="videos" className="videos section-ink">
    <Reveal className="section-head"><p className="section-index">[ 03 — видео ]</p><h2>Дом лучше<br /><em>увидеть в движении.</em></h2></Reveal>
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
      <p>{body || 'Участок и задача → проект и смета → команда и материалы → строительство и сдача. Каждый этап имеет результат и точку контроля.'}</p>
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
  const heroTitle = !hero?.title || /строительство домов под ключ/i.test(hero.title) ? 'Точное соответствие вашим потребностям.' : hero.title
  const founder = section('founder')
  const process = section('process')
  const guarantee = section('guarantee')
  const lead = section('lead')
  const contacts = section('contacts')
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
      status: ['pavlov-sky', 'dom-bezobrazova-repino'].includes(project.slug || '') ? 'Готовый объект' : 'Концепция',
      summary: project.summary || fallback.summary,
      media: [...new Set(gallery.length ? gallery : fallback.media)],
      plan: fallback.plan,
    }
  }) : fallbackProjects, [publicProjects])
  const phone = content?.settings.phone || content?.settings.phone_display || PHONE_DISPLAY
  const phoneLink = content?.settings.phone_href || `tel:${phone.replace(/\D/g, '').replace(/^8/, '+7')}` || PHONE_LINK
  const telegram = content?.telegram_username || content?.settings.telegram || '@kit_comfort'
  const telegramLink = /^https?:\/\//.test(telegram) ? telegram : `https://t.me/${telegram.replace(/^@/, '')}`
  const telegramLabel = /^https?:\/\//.test(telegram) ? telegram : `@${telegram.replace(/^@/, '')}`
  const email = content?.settings.email || 'info@kitstroit.ru'
  const discussCta = hero?.cta_label || 'Обсудить строительство'
  const founderBody = founder?.body || 'Я лично знакомлюсь с каждым проектом и остаюсь на связи до передачи ключей и после неё. Для меня хороший дом — не эффектная картинка, а точная система, которая каждый день делает жизнь семьи проще.'
  return <div className="site" id="top">
    <a className="skip-link" href="#main-content">Перейти к содержанию</a>
    <Header phone={phone} phoneLink={phoneLink} />
    <main id="main-content">
      <section ref={heroRef} className="hero" aria-label="Строительство домов под ключ">
        <div className="hero-media" aria-hidden="true">
          <div className="hero-slide hero-slide-one" />
          <div className="hero-slide hero-slide-two" />
          <div className="hero-slide hero-slide-three" />
          <div className="hero-slide hero-slide-four hero-slide-mobile" />
          <div className="hero-slide hero-slide-five hero-slide-mobile" />
        </div>
        <div className="hero-topline"><span>Санкт-Петербург</span><span>59.9343° N</span><span>Ленинградская область</span></div>
        <div className="hero-content"><p className="eyebrow">Архитектура для жизни · с 2013</p><h1 className="hero-title">{heroTitle}</h1><div className="hero-bottom"><p>{hero?.body || 'Проектируем и строим современные загородные дома под ключ с фиксированной сметой и гарантией 10 лет.'}</p><div className="hero-actions"><a className="button button-light" href={hero?.cta_url || '#lead'} onClick={onCtaClick('hero_calculate')}>{discussCta} <Arrow diagonal /></a><a className="text-link" href={phoneLink} onClick={onPhoneClick}>Позвонить <span>{phone}</span></a></div></div></div>
        <a className="scroll-mark" href="#founder"><span>Листайте</span><i /></a>
      </section>

      <section id="founder" className="founder section-light">
        <div className="founder-intro"><p className="section-index">{founder?.eyebrow || '[ 01 — знакомство ]'}</p><h2>За каждым домом<br />стоит <em>личная ответственность.</em></h2></div>
        <div className="founder-media"><MediaImage src="/media/founder.jpg?v=20260726" alt="Савин Никита, основатель компании KIT" /><span className="founder-tag">Основатель KIT · Савин Никита</span></div>
        <Reveal className="founder-copy"><h3>Никита Савин <span>основатель компании</span></h3><p>{founderBody}</p><p>Отец четверых детей, живу за городом и хорошо понимаю цену удобной планировки, спокойной стройки и решений, о которых не приходится жалеть.</p><a className="text-arrow" href={founder?.cta_url || '#lead'} onClick={onCtaClick('founder_discuss')}>{founder?.cta_label || 'Обсудить дом с Никитой'} <Arrow diagonal /></a></Reveal>
      </section>

      <ProjectMagazine projects={projects} />
      <VideoReviews />
      <ProcessSection eyebrow={process?.eyebrow} title={process?.title} body={process?.body} />

      <section className="proof section-light grid-lines"><Reveal className="proof-intro"><p className="section-index">[ 05 — преимущества ]</p><h2>Красиво — значит ещё и <em>предсказуемо.</em></h2></Reveal><div className="proof-grid">{advantages.map(([title, text], i) => <Reveal key={title} className={`metric${title === 'Поэтапная оплата' ? ' metric-accent' : ''}`} delay={i * 60}><span className="metric-index">0{i + 1}</span><strong>{title}</strong><p>{text}</p></Reveal>)}</div></section>

      <section className="guarantees section-ink grid-lines"><Reveal className="section-head"><p className="section-index">{guarantee?.eyebrow || '[ 06 — договор ]'}</p><h2>{guarantee?.title || <>Не мелкий шрифт.<br /><em>А ясные правила.</em></>}</h2></Reveal><div className="guarantee-layout"><Reveal className="guarantee-big"><strong>10</strong><span>лет<br />гарантии</span><p>{guarantee?.body || 'Письменно. На все выполненные работы.'}</p></Reveal><div className="guarantee-list">{[['Цена', 'Смета фиксируется в договоре. Без скрытых платежей.'], ['Сроки', 'Поэтапный календарный план и ответственность сторон.'], ['Контроль', 'Фотоотчёты и акты на скрытые работы.'], ['Команда', 'Закреплённый прораб и свои мастера.']].map(([title, text], i) => <Reveal className="guarantee-item" key={title} delay={i * 60}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>

      <section className="faq section-light grid-lines"><Reveal className="section-head"><p className="section-index">[ 07 — коротко о важном ]</p><h2>Частые<br /><em>вопросы.</em></h2></Reveal><div className="faq-list">{faqs.map(([question, answer], i) => <Reveal key={question} delay={i * 50}><details onToggle={(event) => { const el = event.currentTarget; if (el.open) trackFaqOpen(question, i + 1) }}><summary><span>0{i + 1}</span>{question}<i>+</i></summary><p>{answer}</p></details></Reveal>)}</div></section>

      <section id="lead" className="lead section-brass grid-lines"><Reveal className="lead-copy"><p className="section-index">{lead?.eyebrow || '[ 08 — первый шаг ]'}</p><h2>{lead?.title || <>Начнём с вашего <em>участка.</em></>}</h2><p>{lead?.body || 'Оставьте номер — перезвоним, зададим несколько вопросов и сориентируем по срокам и бюджету.'}</p></Reveal><Reveal className="lead-form-wrap"><LeadForm /></Reveal></section>

      <section id="contacts" className="contacts section-ink"><p className="section-index">{contacts?.eyebrow || '[ прямой контакт ]'}</p><a className="contact-phone" href={phoneLink} onClick={onPhoneClick}>{phone} <Arrow diagonal /></a><div className="contacts-grid"><a href={telegramLink} target="_blank" rel="noreferrer" onClick={onTelegramClick}><span>Telegram</span>{telegramLabel}</a><a href={`mailto:${email}`}><span>Email</span>{email}</a><p><span>Часы работы</span>{content?.settings.work_hours || 'Ежедневно · 09:00–21:00'}</p><p><span>География</span>{content?.settings.region || 'Санкт-Петербург и ЛО'}</p></div></section>
    </main>
    <footer><a className="logo" href="#top"><span>K</span><span>I</span><span>T</span></a><p>Строительство домов под ключ<br />в Санкт-Петербурге и Ленинградской области</p><p>© 2026 KIT. Все права защищены.</p><a href="/privacy">Политика конфиденциальности</a></footer>
    <div className={`mobile-cta${showMobileCta ? ' is-visible' : ''}`}><a href={phoneLink} onClick={onPhoneClick}>Позвонить</a><a href={hero?.cta_url || '#lead'} onClick={onCtaClick('mobile_calculate')}>{discussCta} <Arrow diagonal /></a></div>
  </div>
}

export default App
