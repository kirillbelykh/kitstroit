import { LeadForm, Reveal } from '../components'
import LabChrome, { KitMark } from './LabChrome'
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
import './ledger.css'

export default function LedgerLab() {
  return (
    <LabChrome activePath="/design-lab/ledger">
      <main className="ledger" id="top">
        <section className="ledger__hero">
          <div className="ledger__hero-copy">
            <div>
              <KitMark />
              <p className="ledger__eyebrow" style={{ marginTop: '1.35rem' }}>
                Technical Ledger · {LAB_GEO}
              </p>
              <h1>Строительство под ключ как спецификация: смета, этапы, ответственность</h1>
              <p>{LAB_SERVICE}</p>
              <div className="ledger__actions">
                <a className="ledger__btn" href="#lead">
                  Обсудить строительство
                </a>
                <a className="ledger__btn ledger__btn--ghost" href="#proof">
                  Спецификация
                </a>
              </div>
            </div>
            <div className="ledger__meta-row">
              <span>Region / SPb + LO</span>
              <span>Contract / Fixed</span>
              <span>Warranty / 10Y</span>
            </div>
          </div>
          <div className="ledger__hero-side">
            <p className="ledger__eyebrow">Reference frame</p>
            <img src="/media/project-courtyard.jpg" alt="Фасад и двор загородного дома" fetchPriority="high" />
          </div>
        </section>

        <section className="ledger__section ledger__pad" id="proof">
          <Reveal className="ledger__section-head">
            <span className="ledger__num">01</span>
            <div>
              <h2>Доказательства как спецификация</h2>
              <p>Смета, оплата, гарантия и прораб — без декоративного glow.</p>
            </div>
          </Reveal>
          <div className="ledger__spec">
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

        <section className="ledger__section ledger__pad" id="projects">
          <Reveal className="ledger__section-head">
            <span className="ledger__num">02</span>
            <div>
              <h2>Объекты с метаданными</h2>
              <p>Площадь / локация / статус. Концепции помечены отдельно.</p>
            </div>
          </Reveal>
          <div className="ledger__projects">
            {LAB_PROJECTS.map((project) => (
              <Reveal key={project.title}>
                <article className="ledger__project">
                  <img src={project.image} alt={project.title} loading="lazy" />
                  <div>
                    <h3>{project.title}</h3>
                    <p>{project.summary}</p>
                  </div>
                  <data value={project.place}>{project.place}</data>
                  <data value={project.status}>{project.status}</data>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="ledger__section ledger__pad" id="process">
          <Reveal className="ledger__section-head">
            <span className="ledger__num">03</span>
            <div>
              <h2>Процесс как ledger</h2>
              <p>Четыре контролируемых этапа от участка до акта сдачи.</p>
            </div>
          </Reveal>
          <div className="ledger__process">
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

        <section className="ledger__section ledger__pad" id="lead" style={{ borderBottom: 0 }}>
          <Reveal className="ledger__section-head">
            <span className="ledger__num">04</span>
            <div>
              <h2>Заявка</h2>
              <p>
                {LAB_GEO}. <a href={LAB_PHONE_LINK}>{LAB_PHONE}</a>
                {' · '}
                <a href={LAB_TELEGRAM_LINK} target="_blank" rel="noreferrer">
                  Telegram
                </a>
              </p>
            </div>
          </Reveal>
          <div className="ledger__lead">
            <Reveal>
              <p className="ledger__eyebrow">CTA</p>
              <h2 style={{ fontFamily: "'IBM Plex Serif', Georgia, serif", fontWeight: 500, margin: '0.6rem 0 0' }}>
                Обсудить строительство
              </h2>
            </Reveal>
            <Reveal>
              <LeadForm />
            </Reveal>
          </div>
        </section>

        <footer className="ledger__foot">KIT · Technical Ledger lab · production header unchanged</footer>
      </main>
    </LabChrome>
  )
}
