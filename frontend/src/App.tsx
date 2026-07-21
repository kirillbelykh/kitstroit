import { useEffect, useMemo, useState } from 'react'
import { Arrow, LeadForm, MediaImage, PHONE_DISPLAY, PHONE_LINK, Reveal } from './components'
import { api } from './api'

type ContentSection = { key: string; eyebrow?: string; title?: string; body?: string; cta_label?: string; cta_url?: string; enabled?: boolean }
type PublicProject = { id?: number; title: string; summary?: string; location?: string; area?: string | number; cover_url?: string; published?: boolean; media?: { url: string }[] }
type PublicContent = { settings: Record<string, string>; sections: ContentSection[]; projects: PublicProject[]; telegram_username?: string }
type Project = { title: string; place: string; area: string; summary: string; media: string[]; plan: 'line' | 'courtyard' | 'compact' }

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
  ['Северный сад · гостиная', '/media/reviews/minimalist-living-room.mp4', '/media/generated/project-interior.webp'],
  ['Дом у воды · дерево и свет', '/media/reviews/warm-wood-interior.mp4', '/media/project-lake.jpg'],
  ['Тихая терраса · мастер-спальня', '/media/reviews/luxury-interior-pan.mp4', '/media/interior-4k.webp'],
  ['Репино · выход в сад', '/media/reviews/interior-with-terrace.mp4', '/media/project-cabin.jpg'],
  ['От эскиза к проекту', '/media/reviews/architectural-blueprints.mp4', '/media/project-courtyard.jpg'],
  ['Сборка каркаса', '/media/reviews/house-construction-team.mp4', '/media/generated/process-frame.webp'],
  ['Сосновый склон · кухня', '/media/reviews/warm-wood-interior.mp4', '/media/generated/project-interior.webp'],
  ['Дом у озера · вечер', '/media/reviews/interior-with-terrace.mp4', '/media/hero-evening-4k.webp'],
  ['Архитектурный надзор', '/media/reviews/architectural-blueprints.mp4', '/media/project-lake.jpg'],
  ['Передача готового дома', '/media/reviews/minimalist-living-room.mp4', '/media/project-cabin.jpg'],
] as const

const steps = [
  ['01', 'Знакомство и участок', 'Выезжаем, изучаем рельеф и коммуникации. Собираем ваши сценарии жизни, а не список комнат.', '/media/founder.jpg'],
  ['02', 'Архитектура и смета', 'Фиксируем планировку, материалы, инженерные решения, стоимость и календарный план.', '/media/reviews/architectural-blueprints.mp4'],
  ['03', 'Строительство', 'Один прораб и постоянная команда. Фотоотчёты, акты скрытых работ и контроль каждого этапа.', '/media/generated/process-frame.webp'],
  ['04', 'Передача дома', 'Проверяем системы, устраняем замечания и передаём готовый дом с комплектом документов.', '/media/generated/project-forest.webp'],
] as const

const testimonials = [
  { name: 'Анна и Михаил', place: 'Дом 186 м² · Всеволожский район', text: 'Мы боялись не самой стройки, а бесконечных решений и сюрпризов в смете. В KIT всё было разложено по этапам: мы видели ход работ, понимали бюджет и в итоге получили именно тот спокойный дом, который представляли.', image: '/media/generated/project-forest.webp' },
  { name: 'Екатерина', place: 'Дом 164 м² · Репино', text: 'В проекте услышали не только наши пожелания, но и привычки. Где оставить коляску, как зайти с собаками после прогулки, куда падает утренний свет. Из таких деталей и получилось ощущение дома.', image: '/media/project-cabin.jpg' },
  { name: 'Илья и Дарья', place: 'Дом 214 м² · Приозерский район', text: 'На объект приезжали спокойно: порядок, понятный следующий этап, прораб всегда на связи. Особенно ценим, что все сложные моменты объясняли человеческим языком и давали выбор.', image: '/media/project-lake.jpg' },
] as const

const faqs = [
  ['Можно ли построить по нашему проекту?', 'Да. Проверим готовый проект, адаптируем его к участку и инженерным условиям. Если проекта нет — разработаем с нуля.'],
  ['Смета действительно не меняется?', 'Стоимость и состав работ фиксируем в договоре. Изменения возможны только по вашему решению и оформляются отдельным соглашением.'],
  ['Как контролировать стройку?', 'У вас будет календарный план, закреплённый прораб и регулярные фотоотчёты. Скрытые работы принимаются по актам.'],
  ['Какая гарантия на дом?', 'Даём письменную гарантию 3 года на выполненные работы и остаёмся на связи после передачи дома.'],
]

function Header({ phone, phoneLink }: { phone: string; phoneLink: string }) {
  const [open, setOpen] = useState(false)
  return <header className={open ? 'site-header menu-open' : 'site-header'}>
    <button className="menu-button" aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}><span /><span /><span className="sr-only">Меню</span></button>
    <nav id="main-menu" className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Главная навигация">
      <div><a href="#projects" onClick={() => setOpen(false)}>Проекты</a><a href="#founder" onClick={() => setOpen(false)}>Основатель</a></div>
      <div><a href="#videos" onClick={() => setOpen(false)}>Видео</a><a href="#process" onClick={() => setOpen(false)}>Как строим</a></div>
    </nav>
    <a className="logo header-logo" href="#top" aria-label="KIT — на главную"><span>K</span><span>I</span><span>T</span></a>
    <a className="header-phone" href={phoneLink}>{phone}</a>
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

function ProjectMagazine({ projects }: { projects: Project[] }) {
  const [activeProject, setActiveProject] = useState(0)
  const [activeMedia, setActiveMedia] = useState(0)
  const project = projects[activeProject]
  const selectProject = (index: number) => { setActiveProject(index); setActiveMedia(0) }
  const move = (direction: number) => setActiveMedia((activeMedia + direction + project.media.length) % project.media.length)
  return <section id="projects" className="projects section-ink">
    <Reveal className="section-head"><p className="section-index">[ 02 — проекты ]</p><h2>Архитектура,<br /><em>которую хочется листать.</em></h2><p>Каждый проект — история места, семьи и точных решений. Выберите дом и откройте его как журнал.</p></Reveal>
    <div className="project-tabs" role="tablist" aria-label="Проекты">{projects.map((item, index) => <button key={item.title} role="tab" aria-selected={index === activeProject} onClick={() => selectProject(index)}><span>0{index + 1}</span>{item.title}</button>)}</div>
    <div className="magazine">
      <div className="magazine-media">
        <img key={project.media[activeMedia]} src={project.media[activeMedia]} alt={`${project.title}, кадр ${activeMedia + 1}`} />
        <div className="magazine-controls"><button aria-label="Предыдущий кадр" onClick={() => move(-1)}>←</button><span>{String(activeMedia + 1).padStart(2, '0')} / {String(project.media.length).padStart(2, '0')}</span><button aria-label="Следующий кадр" onClick={() => move(1)}>→</button></div>
      </div>
      <div className="magazine-copy">
        <p className="section-index">{project.place}</p><h3>{project.title}</h3><p>{project.summary}</p>
        <dl><div><dt>Площадь</dt><dd>{project.area}</dd></div><div><dt>Статус</dt><dd>Концепция</dd></div><div><dt>Гарантия</dt><dd>3 года</dd></div></dl>
        <a className="text-arrow" href="#lead">Обсудить похожий дом <Arrow diagonal /></a>
      </div>
    </div>
    <div className="plan-spread"><div><p className="section-index">[ планировочное решение ]</p><h3>Сначала — <em>как вы живёте.</em><br />Потом — как выглядит дом.</h3><p>Схема временная и показывает логику подачи. Для реального проекта публикуем планы, фасады и ключевые узлы.</p></div><ProjectPlan variant={project.plan} /></div>
  </section>
}

function VideoReviews() {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? videoReviews : videoReviews.slice(0, 4)
  return <section id="videos" className="videos section-ink">
    <Reveal className="section-head"><p className="section-index">[ 03 — видео ]</p><h2>Дом лучше<br /><em>увидеть в движении.</em></h2><p>Короткие проходы по пространствам, детали и моменты со стройки. Сейчас здесь временные демонстрационные материалы.</p></Reveal>
    <div className="video-grid">{visible.map(([title, src, poster], index) => <Reveal className="video-card" key={`${title}-${index}`} delay={(index % 4) * 60}><video controls preload="metadata" playsInline poster={poster}><source src={src} type="video/mp4" /></video><div><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3></div></Reveal>)}</div>
    <button className="more-videos" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? 'Свернуть' : 'Больше видео'} <span>{expanded ? '−' : '+'}</span></button>
  </section>
}

function ProcessSection({ eyebrow, title, body }: { eyebrow?: string; title?: string; body?: string }) {
  return <section id="process" className="process section-light">
    <Reveal className="section-head"><p className="section-index">{eyebrow || '[ 04 — процесс ]'}</p><h2>{title || <>Путь к дому.<br /><em>Без неизвестности.</em></>}</h2><p>{body || 'Вы понимаете, что происходит сегодня, зачем это делается и какой следующий шаг.'}</p></Reveal>
    <div className="process-cards">{steps.map(([number, stepTitle, text, media], index) => <Reveal className="process-card" key={number} delay={index * 60}>
      {media.endsWith('.mp4') ? <video src={media} muted autoPlay loop playsInline /> : <img src={media} alt="" loading="lazy" />}
      <div><span>{number}</span><h3>{stepTitle}</h3><p>{text}</p></div>
    </Reveal>)}</div>
  </section>
}

function Testimonials() {
  const [active, setActive] = useState(0)
  const review = testimonials[active]
  const move = (direction: number) => setActive((active + direction + testimonials.length) % testimonials.length)
  return <section className="testimonials section-light">
    <Reveal className="section-head"><p className="section-index">[ 05 — отзывы ]</p><h2>Дом глазами<br /><em>тех, кто уже живёт.</em></h2><p>Временные истории показывают формат блока. Перед публикацией заменим их на подтверждённые отзывы клиентов.</p></Reveal>
    <div className="testimonial-slide"><MediaImage src={review.image} alt={review.place} /><div className="testimonial-copy"><span className="quote-mark">“</span><blockquote>{review.text}</blockquote><p><strong>{review.name}</strong>{review.place}</p><div><button aria-label="Предыдущий отзыв" onClick={() => move(-1)}>←</button><span>0{active + 1} / 0{testimonials.length}</span><button aria-label="Следующий отзыв" onClick={() => move(1)}>→</button></div></div></div>
  </section>
}

function App() {
  const [content, setContent] = useState<PublicContent | null>(null)
  useEffect(() => { api<PublicContent>('/content').then(setContent).catch(() => undefined) }, [])
  const section = (key: string) => content?.sections.find((item) => item.key === key && item.enabled !== false)
  const hero = section('hero')
  const heroTitle = !hero?.title || /строительство домов под ключ/i.test(hero.title) ? 'Строим дома, в которых хочется остаться.' : hero.title
  const founder = section('founder')
  const process = section('process')
  const guarantee = section('guarantee')
  const lead = section('lead')
  const contacts = section('contacts')
  const publicProjects = content?.projects.filter((project) => project.published !== false) ?? []
  const projects = useMemo<Project[]>(() => publicProjects.length ? publicProjects.map((project, index) => {
    const fallback = fallbackProjects[index % fallbackProjects.length]
    const gallery = [project.cover_url, ...(project.media?.map((item) => item.url) || [])].filter((url): url is string => Boolean(url))
    return { title: project.title, place: project.location || 'Санкт-Петербург и ЛО', area: project.area ? `${project.area} м²` : fallback.area, summary: project.summary || fallback.summary, media: gallery.length ? [...new Set(gallery)] : fallback.media, plan: fallback.plan }
  }) : fallbackProjects, [publicProjects])
  const phone = content?.settings.phone || content?.settings.phone_display || PHONE_DISPLAY
  const phoneLink = content?.settings.phone_href || `tel:${phone.replace(/\D/g, '').replace(/^8/, '+7')}` || PHONE_LINK
  const telegram = content?.telegram_username || content?.settings.telegram || '@kit_comfort'
  const telegramLink = telegram.startsWith('@') ? `https://t.me/${telegram.slice(1)}` : telegram
  const email = content?.settings.email || 'info@kitstroit.ru'
  return <div className="site" id="top">
    <Header phone={phone} phoneLink={phoneLink} />
    <main>
      <section className="hero" aria-label="Строительство домов под ключ">
        <div className="hero-media" aria-hidden="true"><div className="hero-slide hero-slide-one" /><div className="hero-slide hero-slide-two" /><div className="hero-slide hero-slide-three" /></div>
        <div className="hero-topline"><span>Санкт-Петербург</span><span>59.9343° N</span><span>Ленинградская область</span></div>
        <div className="hero-content"><p className="eyebrow">Архитектура для жизни · с 2016</p><h1>{heroTitle}</h1><div className="hero-bottom"><p>{hero?.body || 'Проектируем и строим современные загородные дома под ключ с фиксированной сметой и гарантией 3 года.'}</p><div className="hero-actions"><a className="button button-light" href={hero?.cta_url || '#lead'}>{hero?.cta_label || 'Рассчитать стоимость'} <Arrow diagonal /></a><a className="text-link" href={phoneLink}>Позвонить <span>{phone}</span></a></div></div></div>
        <a className="scroll-mark" href="#founder"><span>Листайте</span><i /></a>
      </section>

      <section id="founder" className="founder section-light">
        <div className="founder-intro"><p className="section-index">{founder?.eyebrow || '[ 01 — знакомство ]'}</p><h2>За каждым домом<br />стоит <em>личная ответственность.</em></h2></div>
        <div className="founder-media"><MediaImage src="/media/founder.jpg" alt="Савин Никита, основатель компании KIT" /><span className="founder-tag">Основатель KIT · Савин Никита</span></div>
        <Reveal className="founder-copy"><h3>Никита Савин <span>основатель компании</span></h3><p>{founder?.body || 'Я лично знакомлюсь с каждым проектом и остаюсь на связи до передачи ключей. Для меня хороший дом — не эффектная картинка, а точная система, которая каждый день делает жизнь семьи проще.'}</p><p>Сам живу за городом и хорошо понимаю цену удобной планировки, спокойной стройки и решений, о которых не приходится жалеть.</p><a className="text-arrow" href={founder?.cta_url || '#lead'}>{founder?.cta_label || 'Обсудить дом с Никитой'} <Arrow diagonal /></a></Reveal>
      </section>

      <ProjectMagazine projects={projects} />
      <VideoReviews />
      <ProcessSection eyebrow={process?.eyebrow} title={process?.title} body={process?.body} />
      <Testimonials />

      <section className="proof section-light grid-lines"><Reveal className="proof-intro"><p className="section-index">[ 06 — в цифрах ]</p><h2>Красиво — значит ещё и <em>предсказуемо.</em></h2></Reveal><div className="proof-grid">{[['10', 'лет опыта'], ['120+', 'завершённых объектов'], ['3', 'года письменной гарантии'], ['1', 'ответственный подрядчик']].map(([value, label], i) => <Reveal key={value + label} className="metric" delay={i * 60}><strong>{value}</strong><span>{label}</span></Reveal>)}</div></section>

      <section className="guarantees section-ink grid-lines"><Reveal className="section-head"><p className="section-index">{guarantee?.eyebrow || '[ 07 — договор ]'}</p><h2>{guarantee?.title || <>Не мелкий шрифт.<br /><em>А ясные правила.</em></>}</h2></Reveal><div className="guarantee-layout"><Reveal className="guarantee-big"><strong>3</strong><span>года<br />гарантии</span><p>{guarantee?.body || 'Письменно. На все выполненные работы.'}</p></Reveal><div className="guarantee-list">{[['Цена', 'Смета фиксируется в договоре. Без скрытых платежей.'], ['Сроки', 'Поэтапный календарный план и ответственность сторон.'], ['Контроль', 'Фотоотчёты и акты на скрытые работы.'], ['Команда', 'Закреплённый прораб и свои мастера.']].map(([title, text], i) => <Reveal className="guarantee-item" key={title} delay={i * 60}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></Reveal>)}</div></div></section>

      <section className="faq section-light grid-lines"><Reveal className="section-head"><p className="section-index">[ 08 — коротко о важном ]</p><h2>Частые<br /><em>вопросы.</em></h2></Reveal><div className="faq-list">{faqs.map(([question, answer], i) => <Reveal key={question} delay={i * 50}><details><summary><span>0{i + 1}</span>{question}<i>+</i></summary><p>{answer}</p></details></Reveal>)}</div></section>

      <section id="lead" className="lead section-brass grid-lines"><Reveal className="lead-copy"><p className="section-index">{lead?.eyebrow || '[ 09 — первый шаг ]'}</p><h2>{lead?.title || <>Начнём с вашего <em>участка.</em></>}</h2><p>{lead?.body || 'Оставьте номер — перезвоним, зададим несколько вопросов и сориентируем по срокам и бюджету.'}</p></Reveal><Reveal className="lead-form-wrap"><LeadForm /></Reveal></section>

      <section id="contacts" className="contacts section-ink"><p className="section-index">{contacts?.eyebrow || '[ прямой контакт ]'}</p><a className="contact-phone" href={phoneLink}>{phone} <Arrow diagonal /></a><div className="contacts-grid"><a href={telegramLink} target="_blank" rel="noreferrer"><span>Telegram</span>{telegram}</a><a href={`mailto:${email}`}><span>Email</span>{email}</a><p><span>Часы работы</span>{content?.settings.work_hours || 'Ежедневно · 09:00–21:00'}</p><p><span>География</span>{content?.settings.region || 'Санкт-Петербург и ЛО'}</p></div></section>
    </main>
    <footer><a className="logo" href="#top"><span>K</span><span>I</span><span>T</span></a><p>Строительство домов под ключ<br />в Санкт-Петербурге и Ленинградской области</p><p>© 2026 KIT. Все права защищены.</p><a href="/privacy">Политика конфиденциальности</a></footer>
    <div className="mobile-cta"><a href={phoneLink}>Позвонить</a><a href={hero?.cta_url || '#lead'}>{hero?.cta_label || 'Рассчитать дом'} <Arrow diagonal /></a></div>
  </div>
}

export default App
