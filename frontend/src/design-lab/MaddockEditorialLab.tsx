import { LeadForm, Reveal } from '../components'
import LabChrome, { ConfirmBadge, KitMark } from './LabChrome'
import {
  LAB_GEO,
  LAB_PHONE,
  LAB_PHONE_LINK,
  LAB_PROJECTS,
  LAB_SERVICE,
  LAB_TELEGRAM_LINK,
} from './lab-content'
import './maddock.css'

export default function MaddockEditorialLab() {
  return (
    <LabChrome activePath="/test">
      <main className="maddock" id="top">
        <section className="maddock__hero" aria-label="Hero">
          <div className="maddock__hero-media" aria-hidden="true">
            <img
              src="/media/hero-evening-4k.webp"
              alt=""
              fetchPriority="high"
            />
          </div>
          <div className="maddock__hero-shade" aria-hidden="true" />

          <nav className="maddock__nav" aria-label="На странице">
            <KitMark large href="#top" />
            <div className="maddock__nav-links">
              <a href="#projects">Проекты</a>
              <a href="#about">О компании</a>
              <a href="#lead">Заявка</a>
            </div>
          </nav>

          <div className="maddock__hero-body">
            <p className="maddock__eyebrow">Архитектура для жизни · {LAB_GEO}</p>
            <h1>
              Дома под ключ
              <br />
              <em>с характером места</em>
            </h1>
            <p className="maddock__lead">{LAB_SERVICE}</p>
            <div className="maddock__actions">
              <a className="maddock__btn" href="#lead">
                Обсудить строительство →
              </a>
              <a className="maddock__text-link" href="#projects">
                Смотреть проекты
              </a>
            </div>
          </div>
        </section>

        <section className="maddock__section" id="about">
          <Reveal className="maddock__section-head">
            <p>01 — подход</p>
            <h2>
              Спокойная точность,
              <br />
              <em>а не декоративный шум</em>
            </h2>
          </Reveal>
          <Reveal className="maddock__meta">
            <div>
              <h3>
                Опыт
                <ConfirmBadge />
              </h3>
              <p>
                В материалах встречается формулировка «с 2013 / 13 лет». Для рекламы факт
                требует подтверждения владельцем.
              </p>
            </div>
            <div>
              <h3>География</h3>
              <p>Работаем в Санкт-Петербурге и Ленинградской области — один фокус, без размытия.</p>
            </div>
            <div>
              <h3>Под ключ</h3>
              <p>От задачи и участка до сметы, строительства и передачи дома по акту.</p>
            </div>
          </Reveal>
        </section>

        <section className="maddock__section maddock__section--graphite" id="projects">
          <Reveal className="maddock__section-head">
            <p>02 — проекты</p>
            <h2>
              Объекты как
              <br />
              <em>журнальный разворот</em>
            </h2>
          </Reveal>
          <div className="maddock__gallery">
            {LAB_PROJECTS.map((project) => (
              <Reveal key={project.title}>
                <figure className="maddock__shot">
                  <img src={project.image} alt={project.title} loading="lazy" />
                  <figcaption>
                    <strong>{project.title}</strong>
                    {project.place} · {project.status}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="maddock__section" id="lead">
          <div className="maddock__final">
            <Reveal>
              <h2>
                Если дом ещё
                <br />
                в голове — начнём
                <br />
                с разговора.
              </h2>
              <p>
                Коротко расскажите о участке и задаче. Мы свяжемся в рабочее время.
                Телефон:{' '}
                <a href={LAB_PHONE_LINK}>{LAB_PHONE}</a>
                {' · '}
                <a href={LAB_TELEGRAM_LINK} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              </p>
              <div className="maddock__actions">
                <a className="maddock__btn" href="#lead-form">
                  Обсудить строительство →
                </a>
              </div>
            </Reveal>
            <Reveal>
              <div id="lead-form">
                <LeadForm />
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="maddock__foot">
          KIT · experimental design lab · production Header не изменён
        </footer>
      </main>
    </LabChrome>
  )
}
