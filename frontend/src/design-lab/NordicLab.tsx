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
} from './lab-content'
import './nordic.css'

export default function NordicLab() {
  return (
    <LabChrome activePath="/design-lab/nordic">
      <main className="nordic" id="top">
        <section className="nordic__hero nordic__pad">
          <div className="nordic__hero-copy">
            <KitMark />
            <p className="nordic__quiet" style={{ marginTop: '1.4rem' }}>
              Nordic Quiet · {LAB_GEO}
            </p>
            <h1>Спокойный загородный дом — свет, дерево и ясный порядок стройки</h1>
            <p>{LAB_SERVICE}</p>
            <div className="nordic__actions">
              <a className="nordic__btn" href="#lead">
                Обсудить строительство
              </a>
              <a className="nordic__btn nordic__btn--line" href="#homes">
                Дома в пейзаже
              </a>
            </div>
          </div>
          <div className="nordic__hero-media">
            <img src="/media/hero-wood-4k.webp" alt="Тёплое дерево и дневной свет" fetchPriority="high" />
          </div>
        </section>

        <section className="nordic__section">
          <div className="nordic__pad">
            <Reveal>
              <p className="nordic__quiet">Материалы и свет</p>
              <h2>Дом ощущается тихим, когда свет и материал работают вместе</h2>
              <p className="nordic__intro">
                Акцент на тёплое дерево, мягкий дневной свет и воздух между решениями — без
                showroom-шума и кислотных акцентов.
              </p>
            </Reveal>
            <div className="nordic__materials">
              <Reveal>
                <figure>
                  <img src="/media/interior-4k.webp" alt="Интерьер с естественным светом" loading="lazy" />
                  <figcaption>Свет как часть архитектуры</figcaption>
                </figure>
              </Reveal>
              <Reveal>
                <figure>
                  <img src="/media/project-cabin.jpg" alt="Дом в окружении природы" loading="lazy" />
                  <figcaption>Дерево и пейзаж</figcaption>
                </figure>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="nordic__section" id="homes">
          <div className="nordic__pad">
            <Reveal>
              <p className="nordic__quiet">Проекты</p>
              <h2>Дома в пейзаже</h2>
              <p className="nordic__intro">Готовые объекты и концепции — без лишней драмы в подаче.</p>
            </Reveal>
            <div className="nordic__homes">
              {LAB_PROJECTS.map((project) => (
                <Reveal key={project.title}>
                  <article>
                    <img src={project.image} alt={project.title} loading="lazy" />
                    <h3>{project.title}</h3>
                    <p>
                      {project.place} · {project.status}
                    </p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="nordic__section">
          <div className="nordic__pad">
            <Reveal>
              <p className="nordic__quiet">Процесс</p>
              <h2>Четыре коротких шага</h2>
            </Reveal>
            <div className="nordic__steps">
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
          </div>
        </section>

        <section className="nordic__section" id="lead" style={{ borderBottom: 0 }}>
          <div className="nordic__pad nordic__lead">
            <Reveal>
              <p className="nordic__quiet">Начать</p>
              <h2>Обсудим строительство без спешки</h2>
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

        <footer className="nordic__foot">KIT · Nordic Quiet lab · production Header не изменён</footer>
      </main>
    </LabChrome>
  )
}
