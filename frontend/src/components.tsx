import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { sendLead } from './api'
import { awaitYmClientId, getLeadAttribution, trackFormError, trackLeadStart, trackLeadSuccess } from './analytics'
import { ConsentCheck } from './components/ConsentCheck'

export const PHONE_DISPLAY = '8 (965) 013-03-33'
export const PHONE_LINK = 'tel:+79650130333'

const STAGE_OPTIONS = [
  'Есть участок',
  'Выбираю участок',
  'Есть готовый проект',
  'Нужен проект с нуля',
] as const

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true" className={diagonal ? 'arrow arrow-diagonal' : 'arrow'}>→</span>
}

export function MediaImage({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`media-shell ${failed ? 'media-missing' : ''} ${className}`}>
      {!failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
      {failed && <span aria-hidden="true" className="media-mark">KIT</span>}
    </div>
  )
}

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el?.classList.add('is-visible')
      return
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible')
        observer.unobserve(el)
      }
    }, { threshold: 0.12 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ '--delay': `${delay}ms` } as CSSProperties}>{children}</div>
}

export function LeadForm({ compact = false }: { compact?: boolean }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const started = useRef(false)
  const submitLock = useRef(false)

  function markStart() {
    if (started.current) return
    started.current = true
    trackLeadStart()
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current || status === 'sending' || status === 'done') return
    submitLock.current = true
    const form = event.currentTarget
    const data = new FormData(form)
    if (!consent) {
      setConsentError(true)
      setError('Нужно согласие на обработку персональных данных')
      setStatus('error')
      submitLock.current = false
      return
    }
    setConsentError(false)
    setStatus('sending')
    setError('')
    try {
      await awaitYmClientId(1000)
      await sendLead({
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        project_type: String(data.get('project_type') ?? STAGE_OPTIONS[0]),
        message: String(data.get('message') ?? ''),
        consent: true,
        ...getLeadAttribution(),
      })
      trackLeadSuccess()
      form.reset()
      setConsent(false)
      setStatus('done')
    } catch (cause) {
      trackFormError()
      setError(cause instanceof Error ? cause.message : 'Попробуйте ещё раз')
      setStatus('error')
      submitLock.current = false
    }
  }

  if (status === 'done') {
    return <div className="form-success" role="status"><span>Спасибо.</span><p>Заявка сохранена — мы свяжемся с вами в рабочее время.</p></div>
  }

  return (
    <form className={compact ? 'lead-form compact' : 'lead-form'} onSubmit={submit} onFocus={markStart}>
      <label><span>01 / Имя</span><input name="name" required autoComplete="name" placeholder="Как к вам обращаться" /></label>
      <label><span>02 / Телефон</span><input name="phone" required type="tel" autoComplete="tel" placeholder="+7 ___ ___ __ __" /></label>
      {!compact && <>
        <label><span>03 / На каком этапе вы находитесь?</span><select name="project_type" defaultValue={STAGE_OPTIONS[0]}>{STAGE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select></label>
        <label className="wide"><span>04 / О проекте</span><textarea name="message" rows={3} placeholder="Участок, площадь, пожелания — если уже известны" /></label>
      </>}
      <div className="form-action wide">
        <button className="button button-solid" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Отправить заявку'} <Arrow diagonal /></button>
        <label className="consent">
          <ConsentCheck
            checked={consent}
            onChange={(next) => { setConsent(next); if (next) setConsentError(false) }}
            invalid={consentError}
          />
          <span>Согласен с <a href="/privacy" target="_blank" rel="noreferrer">обработкой персональных данных</a></span>
        </label>
      </div>
      {status === 'error' && <p className="form-error wide" role="alert">{error}</p>}
    </form>
  )
}
