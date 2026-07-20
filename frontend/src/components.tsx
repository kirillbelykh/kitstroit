import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { sendLead } from './api'

export const PHONE_DISPLAY = '8 (965) 013-03-33'
export const PHONE_LINK = 'tel:+79650130333'

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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    setStatus('sending')
    setError('')
    try {
      await sendLead({
        name: String(data.get('name') ?? ''),
        phone: String(data.get('phone') ?? ''),
        project_type: String(data.get('project_type') ?? 'Строительство дома'),
        message: String(data.get('message') ?? ''),
        consent: true,
      })
      form.reset()
      setStatus('done')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Попробуйте ещё раз')
      setStatus('error')
    }
  }

  if (status === 'done') {
    return <div className="form-success" role="status"><span>Заявка принята</span><p>Мы позвоним в течение 30 минут.</p></div>
  }

  return (
    <form className={compact ? 'lead-form compact' : 'lead-form'} onSubmit={submit}>
      <label><span>01 / Имя</span><input name="name" required autoComplete="name" placeholder="Как к вам обращаться" /></label>
      <label><span>02 / Телефон</span><input name="phone" required type="tel" autoComplete="tel" placeholder="+7 ___ ___ __ __" /></label>
      {!compact && <>
        <label><span>03 / Тип объекта</span><select name="project_type" defaultValue="Строительство дома"><option>Строительство дома</option><option>Есть готовый проект</option><option>Нужен проект с нуля</option></select></label>
        <label className="wide"><span>04 / О проекте</span><textarea name="message" rows={3} placeholder="Участок, площадь, пожелания — если уже известны" /></label>
      </>}
      <div className="form-action wide">
        <button className="button button-solid" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Получить расчёт'} <Arrow diagonal /></button>
        <label className="consent"><input type="checkbox" required /> <span>Согласен с <a href="/privacy" target="_blank">обработкой персональных данных</a></span></label>
      </div>
      {status === 'error' && <p className="form-error wide" role="alert">{error}</p>}
    </form>
  )
}
