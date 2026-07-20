import { useEffect, useState } from 'react'
import { Arrow, LeadForm, MediaImage, PHONE_DISPLAY, PHONE_LINK, Reveal } from './components'
import { api } from './api'

type ContentSection = { key: string; eyebrow?: string; title?: string; body?: string; cta_label?: string; cta_url?: string; enabled?: boolean }
type PublicProject = { id?: number; title: string; summary?: string; location?: string; area?: string | number; cover_url?: string; published?: boolean; media?: { url: string }[] }
type PublicContent = { settings: Record<string, string>; sections: ContentSection[]; projects: PublicProject[]; telegram_username?: string }

const fallbackProjects = [
  { title: 'Дом у воды', place: 'Ленинградская область', meta: '186 м² · камень / дерево', src: '/media/project-lake.jpg', className: 'project-primary' },
  { title: 'Сосновый склон', place: 'Курортный район', meta: '242 м² · монолит', src: '/media/project-courtyard.jpg', className: 'project-tall' },
  { title: 'Тихая терраса', place: 'Репино', meta: '164 м² · газобетон', src: '/media/project-cabin.jpg', className: 'project-wide' },
]

const steps = [
  ['01', 'Знакомство и участок', 'Выезжаем, изучаем рельеф и коммуникации. Собираем ваши сценарии жизни, а не список комнат.'],
  ['02', 'Проект и точная смета', 'Фиксируем архитектуру, материалы, инженерные решения, стоимость и календарный план.'],
  ['03', 'Строительство', 'Один прораб и постоянная команда. Фотоотчёты, акты скрытых работ, контроль каждого этапа.'],
  ['04', 'Передача дома', 'Проверяем системы, устраняем замечания и передаём готовый дом с комплектом документов.'],
]

const faqs = [
  ['Можно ли построить по нашему проекту?', 'Да. Проверим готовый проект, адаптируем его к участку и инженерным условиям. Если проекта нет — разработаем с нуля.'],
  ['Смета действительно не меняется?', 'Стоимость и состав работ фиксируем в договоре. Изменения возможны только по вашему решению и оформляются отдельным соглашением.'],
  ['Как контролировать стройку?', 'У вас будет календарный план, закреплённый прораб и регулярные фотоотчёты. Скрытые работы принимаются по актам.'],
  ['Какая гарантия на дом?', 'Даём письменную гарантию 3 года на выполненные работы и остаёмся на связи после передачи дома.'],
  ['Где вы строите?', 'Работаем в Санкт-Петербурге и Ленинградской области. Возможность выезда дальше обсуждаем отдельно.'],
]

function Header({ phone, phoneLink, ctaLabel = 'Обсудить проект', ctaUrl = '#lead' }: { phone: string; phoneLink: string; ctaLabel?: string; ctaUrl?: string }) {
  const [open, setOpen] = useState(false)
  return <header className="site-header">
    <a className="logo" href="#top" aria-label="KIT — на главную"><span>K</span><span>I</span><span>T</span></a>
    <button className="menu-button" aria-expanded={open} aria-controls="main-menu" onClick={() => setOpen(!open)}><span /><span /><span className="sr-only">Меню</span></button>
    <nav id="main-menu" className={open ? 'main-nav is-open' : 'main-nav'} aria-label="Главная навигация">
      <a href="#projects" onClick={() => setOpen(false)}>Проекты</a>
      <a href="#process" onClick={() => setOpen(false)}>Как строим</a>
      <a href="#founder" onClick={() => setOpen(false)}>О компании</a>
      <a href="#contacts" onClick={() => setOpen(false)}>Контакты</a>
    </nav>
    <a className="header-phone" href={phoneLink}>{phone}</a>
    <a className="header-cta" href={ctaUrl}>{ctaLabel} <Arrow diagonal /></a>
  </header>
}

function App() {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
  const [content, setContent] = useState<PublicContent | null>(null)
  useEffect(() => { api<PublicContent>('/content').then(setContent).catch(() => undefined) }, [])
  const section = (key: string) => content?.sections.find((item) => item.key === key && item.enabled !== false)
  const hero = section('hero')
  const proof = section('proof')
  const process = section('process')
  const guarantee = section('guarantee')
  const founder = section('founder')
  const lead = section('lead')
  const contacts = section('contacts')
  const publicProjects = content?.projects.filter((project) => project.published !== false) ?? []
  const projects = publicProjects.length ? publicProjects.map((project, index) => ({ title: project.title, place: project.location || 'Санкт-Петербург и ЛО', meta: [project.area ? `${project.area} м²` : '', project.summary || ''].filter(Boolean).join(' · '), src: project.cover_url || project.media?.[0]?.url || fallbackProjects[index % fallbackProjects.length].src, className: fallbackProjects[index % fallbackProjects.length].className })) : fallbackProjects
  const phone = content?.settings.phone || content?.settings.phone_display || PHONE_DISPLAY
  const phoneLink = content?.settings.phone_href || `tel:${phone.replace(/\D/g, '').replace(/^8/, '+7')}` || PHONE_LINK
  const telegram = content?.telegram_username || content?.settings.telegram || '@kit_comfort'
  const telegramLink = telegram.startsWith('@') ? `https://t.me/${telegram.slice(1)}` : telegram
  const email = content?.settings.email || 'info@kitstroit.ru'
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const update = () => {
      document.documentElement.style.setProperty('--page-y', `${window.scrollY}px`)
      frame = 0
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    addEventListener('scroll', onScroll, { passive: true })
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(frame) }
  }, [])

  return <div className="site" id="top">
    <Header phone={phone} phoneLink={phoneLink} ctaLabel={hero?.cta_label} ctaUrl={hero?.cta_url} />
    <main>
      <section className="hero" aria-label="Строительство домов под ключ">
        <div className="hero-media">
          {!reduceMotion && <video autoPlay muted loop playsInline poster="/media/hero.jpg" onError={(e) => { e.currentTarget.style.display = 'none' }}><source src="/media/hero.mp4" type="video/mp4" /></video>}
          <div className="hero-fallback" />
        </div>
        <div className="hero-grid grid-lines" />
        <div className="hero-topline"><span>Санкт-Петербург</span><span>59.9343° N</span><span>Ленинградская область</span></div>
        <div className="hero-content">
          <p className="eyebrow">{hero?.eyebrow || 'Архитектура для жизни · с 2016'}</p>
          {hero?.title ? <h1 className="cms-hero-title"><span>{hero.title}</span></h1> : <h1><span>Строительство домов</span><em>под ключ</em><span>с&nbsp;фиксированной сметой</span></h1>}
          <div className="hero-bottom">
            <p>{hero?.body || 'Проектируем и строим современные загородные дома, в которых всё продумано до привычки.'}</p>
            <div className="hero-actions"><a className="button button-light" href={hero?.cta_url || '#lead'}>{hero?.cta_label || 'Рассчитать стоимость'} <Arrow diagonal /></a><a className="text-link" href={phoneLink}>Позвонить <span>{phone}</span></a></div>
          </div>
        </div>
        <a className="scroll-mark" href="#proof"><span>Листайте</span><i /></a>
      </section>

      <section id="proof" className="proof section-light grid-lines">
        <Reveal className="proof-intro"><p className="section-index">{proof?.eyebrow || '[ 01 — доверие ]'}</p>{proof?.title ? <h2>{proof.title}</h2> : <h2>Дом — слишком важная вещь, чтобы строить его <em>на обещаниях.</em></h2>}</Reveal>
        <div className="proof-grid">
          {[['10', 'лет опыта'], ['120+', 'завершённых объектов'], ['3', 'года письменной гарантии'], ['12–18%', 'экономии на материалах']].map(([value, label], i) => <Reveal key={value} className="metric" delay={i * 80}><strong>{value}</strong><span>{label}</span></Reveal>)}
        </div>
        <Reveal className="proof-note"><span>01</span><p>{proof?.body || 'Стоимость, материалы и сроки фиксируем до начала работ. Любое изменение — только после вашего согласования.'}</p></Reveal>
      </section>

      <section id="projects" className="projects section-ink">
        <Reveal className="section-head"><p className="section-index">[ 02 — проекты ]</p><h2>Дома с характером.<br /><em>И точным расчётом.</em></h2><p>Подбираем архитектуру под место, семью и ритм жизни. Медиа ниже — визуальное направление будущих проектов.</p></Reveal>
        <div className="project-stage">
          {projects.map((project, i) => <Reveal key={project.title} className={`project ${project.className}`} delay={i * 100}>
            <MediaImage src={project.src} alt={`${project.title}, ${project.place}`} />
            <div className="project-caption"><span>0{i + 1}</span><div><h3>{project.title}</h3><p>{project.place}</p></div><p>{project.meta}</p></div>
          </Reveal>)}
          <p className="vertical-word" aria-hidden="true">PROJECTS · KIT · 2026</p>
        </div>
      </section>

      <section id="process" className="process section-light grid-lines">
        <Reveal className="section-head process-head"><p className="section-index">{process?.eyebrow || '[ 03 — процесс ]'}</p>{process?.title ? <h2>{process.title}</h2> : <h2>Спокойно.<br />Потому что <em>системно.</em></h2>}<p>{process?.body || 'Вы понимаете, что происходит на объекте сегодня и что будет сделано завтра.'}</p></Reveal>
        <div className="process-list">
          {steps.map(([number, title, text], i) => <Reveal className="process-row" key={number} delay={i * 60}><span>{number}</span><h3>{title}</h3><p>{text}</p><i /></Reveal>)}
        </div>
      </section>

      <section className="statement section-brass">
        <div className="statement-track" aria-hidden="true"><span>ФИКСИРОВАННАЯ СМЕТА · ОДИН ДОГОВОР · СВОЯ КОМАНДА · </span><span>ФИКСИРОВАННАЯ СМЕТА · ОДИН ДОГОВОР · СВОЯ КОМАНДА · </span></div>
        <Reveal><p className="section-index">[ обещание KIT ]</p><blockquote>«Мы делаем как для себя.<br />Потому что по-другому<br /><em>не имеет смысла»</em></blockquote></Reveal>
      </section>

      <section className="guarantees section-ink grid-lines">
        <Reveal className="section-head"><p className="section-index">{guarantee?.eyebrow || '[ 04 — договор ]'}</p>{guarantee?.title ? <h2>{guarantee.title}</h2> : <h2>Не мелкий шрифт.<br /><em>А ясные правила.</em></h2>}</Reveal>
        <div className="guarantee-layout">
          <Reveal className="guarantee-big"><strong>3</strong><span>года<br />гарантии</span><p>{guarantee?.body || 'Письменно. На все выполненные работы.'}</p></Reveal>
          <div className="guarantee-list">
            {[['Цена', 'Смета фиксируется в договоре. Без скрытых платежей.'], ['Сроки', 'Поэтапный календарный план и ответственность сторон.'], ['Контроль', 'Фотоотчёты и акты на скрытые работы.'], ['Команда', 'Закреплённый прораб и свои мастера без случайных бригад.']].map(([title, text], i) => <Reveal className="guarantee-item" key={title} delay={i * 70}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></Reveal>)}
          </div>
        </div>
      </section>

      <section id="founder" className="founder section-light">
        <div className="founder-media"><MediaImage src="/media/founder.jpg" alt="Савин Никита, основатель компании KIT" /><span className="founder-tag">Основатель · личная ответственность</span></div>
        <Reveal className="founder-copy"><p className="section-index">{founder?.eyebrow || '[ 05 — о компании ]'}</p>{founder?.title ? <h2>{founder.title}</h2> : <h2>Человек, который отвечает <em>за результат.</em></h2>}<h3>Савин Никита <span>Владимирович</span></h3><p>{founder?.body || 'Не менеджер из колл-центра, а основатель компании — лично знакомится с каждым проектом и держит связь до сдачи дома.'}</p><p>Никита сам живёт за городом: четверо детей, две собаки и ребёнок с особыми потребностями. Поэтому знает, что хороший дом — не картинка, а система, которая каждый день делает жизнь семьи проще.</p><a className="button button-dark" href={founder?.cta_url || '#lead'}>{founder?.cta_label || 'Обсудить дом с Никитой'} <Arrow diagonal /></a></Reveal>
      </section>

      <section className="faq section-light grid-lines">
        <Reveal className="section-head"><p className="section-index">[ 06 — коротко о важном ]</p><h2>Частые<br /><em>вопросы.</em></h2></Reveal>
        <div className="faq-list">{faqs.map(([question, answer], i) => <Reveal key={question} delay={i * 50}><details><summary><span>0{i + 1}</span>{question}<i>+</i></summary><p>{answer}</p></details></Reveal>)}</div>
      </section>

      <section id="lead" className="lead section-brass grid-lines">
        <Reveal className="lead-copy"><p className="section-index">{lead?.eyebrow || '[ 07 — первый шаг ]'}</p>{lead?.title ? <h2>{lead.title}</h2> : <h2>Начнём с вашего <em>участка.</em></h2>}<p>{lead?.body || 'Оставьте номер — перезвоним в течение 30 минут, зададим несколько вопросов и сориентируем по срокам и бюджету.'}</p></Reveal>
        <Reveal className="lead-form-wrap"><LeadForm /></Reveal>
      </section>

      <section id="contacts" className="contacts section-ink">
        <p className="section-index">{contacts?.eyebrow || '[ прямой контакт ]'}</p><a className="contact-phone" href={phoneLink}>{phone} <Arrow diagonal /></a>
        <div className="contacts-grid"><a href={telegramLink} target="_blank" rel="noreferrer"><span>Telegram</span>{telegram}</a><a href={`mailto:${email}`}><span>Email</span>{email}</a><p><span>Часы работы</span>{content?.settings.work_hours || 'Ежедневно · 09:00–21:00'}</p><p><span>География</span>{content?.settings.region || 'Санкт-Петербург и ЛО'}</p></div>
      </section>
    </main>
    <footer><a className="logo" href="#top"><span>K</span><span>I</span><span>T</span></a><p>Строительство домов под ключ<br />в Санкт-Петербурге и Ленинградской области</p><p>© 2026 KIT. Все права защищены.</p><a href="/privacy">Политика конфиденциальности</a></footer>
    <div className="mobile-cta"><a href={phoneLink} aria-label="Позвонить">Позвонить</a><a href={hero?.cta_url || '#lead'}>{hero?.cta_label || 'Рассчитать дом'} <Arrow diagonal /></a></div>
  </div>
}

export default App
