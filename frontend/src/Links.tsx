import { PHONE_DISPLAY, PHONE_LINK } from './components'
import { trackCtaClick, trackPhoneClick, trackTelegramClick } from './analytics'

const LINKS = [
  { label: 'Сайт', href: 'https://kitstroit.ru', cta: 'links_site', variant: 'primary' as const },
  { label: 'Telegram-канал', href: 'https://t.me/kitstroit/15', cta: 'links_telegram', telegram: true, variant: 'ghost' as const },
  { label: 'Канал Max', href: 'https://6max.ru/kit_stroit', cta: 'links_max', variant: 'ghost' as const },
] as const

export default function Links() {
  return (
    <main className="links-page">
      <div className="links-page__media" aria-hidden="true" />
      <div className="links-page__scrim" aria-hidden="true" />
      <div className="links-page__inner">
        <p className="section-index links-page__eyebrow">[ KIT · контакты ]</p>
        <a className="logo links-page__logo" href="https://kitstroit.ru" target="_blank" rel="noopener noreferrer" onClick={() => trackCtaClick('links_logo')}>
          <span>K</span><span>I</span><span>T</span>
        </a>
        <p className="links-page__tagline">
          Строительство домов под ключ<br />в Санкт-Петербурге и Ленинградской области
        </p>
        <nav className="links-page__nav" aria-label="Контакты KIT">
          {LINKS.map((item) => (
            <a
              key={item.href}
              className={
                item.variant === 'primary'
                  ? 'links-page__row links-page__row--primary'
                  : 'links-page__row'
              }
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackCtaClick(item.cta)
                if ('telegram' in item && item.telegram) trackTelegramClick()
              }}
            >
              {item.label}
            </a>
          ))}
          <a
            className="links-page__row links-page__row--quiet"
            href={PHONE_LINK}
            onClick={() => {
              trackPhoneClick()
              trackCtaClick('links_phone')
            }}
          >
            Позвонить · {PHONE_DISPLAY}
          </a>
        </nav>
        <a className="links-page__home" href="/">На главную →</a>
      </div>
    </main>
  )
}
