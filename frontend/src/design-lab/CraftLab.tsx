import { LeadForm, Reveal } from '../components'
import LabChrome, { ConfirmBadge, KitMark } from './LabChrome'
import {
  LAB_GEO,
  LAB_PHONE,
  LAB_PHONE_LINK,
  LAB_PROCESS,
  LAB_PROJECTS,
  LAB_SERVICE,
  LAB_TELEGRAM_LINK,
} from './lab-content'
import './craft.css'

export default function CraftLab() {
  return (
    <LabChrome activePath="/design-lab/craft">
      <main className="craft" id="top">
        <section className="craft__hero craft__pad">
          <div className="craft__hero-copy">
            <KitMark />
            <p className="craft__kicker" style={{ marginTop: '1.4rem' }}>
              Современное архитектурное ремесло · {LAB_GEO}
            </p>
            <h1>Строим дома, в которых спокойно жить каждый день</h1>
            <p>{LAB_SERVICE}</p>
            <div className="craft__actions">
              <a className="craft__btn" href="#lead">
                Обсудить строительство
              </a>
              <a className="craft__btn craft__btn--ghost" href="#projects">
                Проекты
              </a>
            </div>
          </div>
          <div className="craft__hero-media">
            <img src="/media/hero-wood-4k.webp" alt="Тёплый деревянный интерьер и свет" fetchPriority="high" />
          </div>
        </section>

        <section className="craft__section craft__section--sand">
          <div className="craft__pad craft__split">
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Доверие</p>
              <h2>
                13 лет личной ответственности
                <ConfirmBadge />
              </h2>
              <p>
                В контенте KIT встречается формулировка про опыт с 2013 года. Для рекламы и
                публичных обещаний этот факт помечен как требующий подтверждения владельцем.
              </p>
            </Reveal>
            <Reveal className="craft__media">
              <img src="/media/interior-4k.webp" alt="Интерьер с естественным светом" loading="lazy" />
            </Reveal>
          </div>
        </section>

        <section className="craft__section" id="projects">
          <div className="craft__pad">
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Реализованные проекты</p>
              <h2>Дома, которые уже стоят на земле</h2>
              <p>Показываем готовые объекты и отдельно помечаем концепции.</p>
            </Reveal>
            <div className="craft__grid">
              {LAB_PROJECTS.map((project) => (
                <Reveal className="craft__card" key={project.title}>
                  <img src={project.image} alt={project.title} loading="lazy" />
                  <div>
                    <h3>{project.title}</h3>
                    <p>
                      {project.place} · {project.status}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="craft__section craft__section--sand">
          <div className="craft__pad">
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Команда</p>
              <h2>Всё в одной команде</h2>
              <p>
                Архитектура, смета, прораб и свои мастера — без размытой цепочки подрядчиков.
              </p>
            </Reveal>
            <div className="craft__team">
              {[
                ['Проект', 'Архитектура и планировка под ваш сценарий жизни.'],
                ['Стройка', 'Закреплённый прораб и контроль скрытых работ.'],
                ['Сдача', 'Акты этапов, гарантия и сопровождение после ключей.'],
              ].map(([title, body]) => (
                <Reveal key={title}>
                  <article>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="craft__section craft__section--ink">
          <div className="craft__pad">
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Процесс</p>
              <h2>Процесс строительства</h2>
              <p>Каждый этап имеет результат и точку контроля.</p>
            </Reveal>
            <div className="craft__steps">
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

        <section className="craft__section">
          <div className="craft__pad craft__split craft__split--flip">
            <Reveal className="craft__media">
              <img src="/media/process-nikita.webp" alt="Работа на объекте" loading="lazy" />
            </Reveal>
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Смета и оплата</p>
              <h2>Фиксированная смета и поэтапная оплата</h2>
              <p>
                Стоимость и состав работ фиксируются договором. Оплата — за принятый этап, а не
                «за всё сразу» без результата.
              </p>
              <div className="craft__pair">
                <article>
                  <h3>Фиксированная смета</h3>
                  <p>Изменения только письменно, до начала соответствующих работ.</p>
                </article>
                <article>
                  <h3>Поэтапная оплата</h3>
                  <p>Платите за понятный результат этапа и сохраняете контроль.</p>
                </article>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="craft__section craft__section--sand">
          <div className="craft__pad craft__founder">
            <Reveal>
              <img src="/media/founder.jpg" alt="Никита Савин, основатель KIT" loading="lazy" />
            </Reveal>
            <Reveal className="craft__copy">
              <p className="craft__eyebrow">Основатель</p>
              <h2>Никита как лицо компании</h2>
              <p>
                Никита Савин лично знакомится с каждым проектом и остаётся на связи до передачи
                ключей и после неё. Живёт за городом и понимает цену удобной планировки и спокойной
                стройки.
              </p>
              <div className="craft__actions">
                <a className="craft__btn" href="#lead">
                  Обсудить дом с Никитой
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="craft__section" id="lead">
          <div className="craft__pad craft__lead">
            <Reveal>
              <h2>Обсудим строительство вашего дома</h2>
              <p>
                {LAB_GEO}. Телефон <a href={LAB_PHONE_LINK}>{LAB_PHONE}</a>
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

        <footer className="craft__foot">KIT · S&amp;A Craft lab · production Header не изменён</footer>
      </main>
    </LabChrome>
  )
}
