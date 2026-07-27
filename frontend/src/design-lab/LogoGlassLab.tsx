import { useState } from 'react'
import GlassLogoMark from './GlassLogoMark'
import LabChrome from './LabChrome'
import './logo-glass.css'

const SELECTED_MARK = {
  id: 'mark-kit',
  title: 'K|I|T плитки',
  src: '/design-lab/logo-glass/mark-kit.svg',
  aspect: 'wide' as const,
} as const

type Theme = 'light' | 'dark'

export default function LogoGlassLab() {
  const [theme, setTheme] = useState<Theme>('light')

  return (
    <LabChrome activePath="/design-lab/logo-glass">
      <main className={`logo-glass-lab logo-glass-lab--${theme}`}>
        <div className="logo-glass-lab__intro">
          <h1>Preview: glass-знак K|I|T</h1>
          <p>
            Страница /design-lab/logo-glass — experimental preview. Выбранный вариант — плитки
            K|I|T (mark-kit): Hero и имитация шапки. Production Header и логотип сайта не затронуты.
          </p>
          <div className="logo-glass-lab__theme" role="group" aria-label="Фон превью">
            <button
              type="button"
              className={theme === 'light' ? 'is-active' : undefined}
              aria-pressed={theme === 'light'}
              onClick={() => setTheme('light')}
            >
              Светлый
            </button>
            <button
              type="button"
              className={theme === 'dark' ? 'is-active' : undefined}
              aria-pressed={theme === 'dark'}
              onClick={() => setTheme('dark')}
            >
              Тёмный
            </button>
          </div>
        </div>

        <section className="logo-glass-lab__stage" aria-label={`${SELECTED_MARK.title} preview`}>
          <div className="logo-glass-lab__block">
            <p className="logo-glass-lab__size-label">Hero</p>
            <div
              className={`logo-glass-lab__hero logo-glass-lab__hero--${SELECTED_MARK.aspect}`}
              data-theme={theme}
            >
              <GlassLogoMark
                src={SELECTED_MARK.src}
                label={`${SELECTED_MARK.title} hero`}
                size="hero"
                theme={theme}
              />
            </div>
          </div>

          <div className="logo-glass-lab__nav-demo" data-theme={theme}>
            <p className="logo-glass-lab__size-label">Навигация</p>
            <div className="logo-glass-lab__nav-bar">
              <div
                className={`logo-glass-lab__nav-mark logo-glass-lab__nav-mark--${SELECTED_MARK.aspect}`}
              >
                <GlassLogoMark
                  src={SELECTED_MARK.src}
                  label={`${SELECTED_MARK.title} nav`}
                  size="nav"
                  theme={theme}
                />
              </div>
              <span className="logo-glass-lab__nav-meta">KIT · строительство</span>
              <span className="logo-glass-lab__nav-cta">Связаться</span>
            </div>
          </div>
        </section>

        <footer className="logo-glass-lab__foot">
          <p>
            Матовое тёплое стекло (bone/brass), без float/rotation. При отсутствии WebGL или
            prefers-reduced-motion — статичный SVG.
          </p>
        </footer>
      </main>
    </LabChrome>
  )
}
