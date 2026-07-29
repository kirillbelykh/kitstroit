import { PHONE_DISPLAY, PHONE_LINK } from './components'
import { trackCtaClick, trackPhoneClick, trackTelegramClick } from './analytics'

const LINKS = [
  { label: 'Сайт', href: 'https://kitstroit.ru', cta: 'links_site' },
  { label: 'Telegram', href: 'https://t.me/kitstroit', cta: 'links_telegram', telegram: true },
  { label: 'Max', href: 'https://6max.ru/kit_stroit', cta: 'links_max' },
] as const

export default function Links() {
  return (
    <main className="links-page">
      <div className="links-page__inner">
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
              className="links-page__row"
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
            className="links-page__row"
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
