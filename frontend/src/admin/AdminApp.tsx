import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import './admin.css'

type View = 'leads' | 'projects' | 'texts' | 'telegram' | 'settings'
type Lead = {
  id: number
  name: string
  phone: string
  project_type?: string
  message?: string
  status: 'new' | 'in_progress' | 'won' | 'lost'
  created_at: string
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_content?: string | null
  utm_term?: string | null
  yclid?: string | null
  ym_client_id?: string | null
  cta?: string | null
  landing_page?: string | null
  referrer?: string | null
  page_url?: string | null
  first_utm_source?: string | null
  first_utm_campaign?: string | null
  first_landing_page?: string | null
}
type ProjectMedia = { id: number; url: string; kind: 'image' | 'video'; alt: string; sort_order: number }
type Project = {
  id: number
  slug: string
  title: string
  summary: string
  location: string
  area: string
  year: string
  cover_url: string
  sort_order: number
  published: boolean
  media?: ProjectMedia[]
}
type TextSection = { id: number; key: string; eyebrow: string; title: string; body: string; cta_label: string; cta_url: string; sort_order: number; enabled: boolean }
type Setting = { id: number; key: string; value: string; public: boolean }
type Telegram = { bot_username: string; admin_chat_ids: number[]; enabled: boolean }

const labels: Record<View, string> = { leads: 'Заявки', projects: 'Проекты и медиа', texts: 'Тексты', telegram: 'Telegram', settings: 'Настройки' }
const emptyProject: Omit<Project, 'id'> = {
  slug: '',
  title: '',
  summary: '',
  location: '',
  area: '',
  year: String(new Date().getFullYear()),
  cover_url: '',
  sort_order: 0,
  published: false,
  media: [],
}
const emptyText: Omit<TextSection, 'id'> = { key: '', eyebrow: '', title: '', body: '', cta_label: '', cta_url: '', sort_order: 0, enabled: true }

function projectPayload(project: Project | Omit<Project, 'id'>) {
  return {
    slug: project.slug.trim(),
    title: project.title.trim(),
    summary: project.summary,
    location: project.location,
    area: String(project.area ?? ''),
    year: String(project.year ?? ''),
    cover_url: project.cover_url,
    sort_order: Number(project.sort_order) || 0,
    published: Boolean(project.published),
  }
}

function textPayload(section: TextSection | Omit<TextSection, 'id'>) {
  return {
    key: section.key.trim(),
    eyebrow: section.eyebrow,
    title: section.title,
    body: section.body,
    cta_label: section.cta_label,
    cta_url: section.cta_url,
    sort_order: Number(section.sort_order) || 0,
    enabled: Boolean(section.enabled),
  }
}

function Login({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setBusy(true); setError('')
    try {
      await api<void>('/admin/login', { method: 'POST', body: JSON.stringify({ username: data.get('username'), password: data.get('password') }) })
      onLogin()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Не удалось войти') }
    finally { setBusy(false) }
  }
  return <main className="admin-login"><form onSubmit={submit}><a className="admin-logo" href="/">KIT<span>admin</span></a><div><label>Логин<input name="username" autoComplete="username" required autoFocus /></label><label>Пароль<input name="password" type="password" autoComplete="current-password" required /></label></div>{error && <p role="alert">{error}</p>}<button disabled={busy}>{busy ? 'Проверяем…' : 'Войти →'}</button><a href="/">← Вернуться на сайт</a></form></main>
}

function leadAttributionSummary(lead: Lead) {
  const parts = [
    lead.utm_source || null,
    lead.utm_campaign || null,
    lead.yclid ? `yclid:${lead.yclid}` : null,
    lead.ym_client_id ? `cid:${lead.ym_client_id}` : null,
    lead.cta ? `cta:${lead.cta}` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : ''
}

function leadAttributionDetails(lead: Lead) {
  return [
    ['utm_source', lead.utm_source],
    ['utm_medium', lead.utm_medium],
    ['utm_campaign', lead.utm_campaign],
    ['utm_content', lead.utm_content],
    ['utm_term', lead.utm_term],
    ['yclid', lead.yclid],
    ['ym_client_id', lead.ym_client_id],
    ['cta', lead.cta],
    ['landing_page', lead.landing_page],
    ['referrer', lead.referrer],
    ['page_url', lead.page_url],
    ['first_utm_source', lead.first_utm_source],
    ['first_utm_campaign', lead.first_utm_campaign],
    ['first_landing_page', lead.first_landing_page],
  ].filter(([, value]) => Boolean(value))
}

function Leads() {
  const [items, setItems] = useState<Lead[]>([])
  const [error, setError] = useState('')
  const load = () => api<Lead[]>('/admin/leads').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  async function change(id: number, status: Lead['status']) { await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load() }
  async function remove(id: number) { if (!confirm('Удалить заявку?')) return; await api(`/admin/leads/${id}`, { method: 'DELETE' }); load() }
  return <section className="admin-section"><SectionHead title="Заявки" note={`${items.length} всего`} /><div className="admin-table-wrap"><table><thead><tr><th>Дата</th><th>Клиент</th><th>Проект</th><th>Сообщение</th><th>Статус</th><th /></tr></thead><tbody>{items.map((lead) => {
    const summary = leadAttributionSummary(lead)
    const details = leadAttributionDetails(lead)
    return <tr key={lead.id}><td>{new Date(lead.created_at).toLocaleString('ru-RU')}</td><td><strong>{lead.name}</strong><a href={`tel:${lead.phone}`}>{lead.phone}</a>{summary && <details className="admin-attribution"><summary>{summary}</summary>{details.length > 0 && <dl>{details.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}</dl>}</details>}</td><td>{lead.project_type || '—'}</td><td className="admin-message">{lead.message || '—'}</td><td><select value={lead.status} onChange={(e) => change(lead.id, e.target.value as Lead['status'])}><option value="new">Новая</option><option value="in_progress">В работе</option><option value="won">Успех</option><option value="lost">Закрыта</option></select></td><td><button className="icon-button" onClick={() => remove(lead.id)} aria-label="Удалить заявку">×</button></td></tr>
  })}</tbody></table>{!items.length && !error && <Empty text="Заявок пока нет" />}{error && <p className="admin-error">{error}</p>}</div></section>
}

function Projects() {
  const [items, setItems] = useState<Project[]>([])
  const [editing, setEditing] = useState<Project | Omit<Project, 'id'> | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => api<Project[]>('/admin/projects').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      const method = 'id' in editing ? 'PATCH' : 'POST'
      const path = 'id' in editing ? `/admin/projects/${editing.id}` : '/admin/projects'
      const saved = await api<Project>(path, { method, body: JSON.stringify(projectPayload(editing)) })
      setEditing(null)
      await load()
      return saved
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить проект')
    } finally {
      setBusy(false)
    }
  }
  async function upload(file: File) {
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const result = await api<{ url: string; kind: 'image' | 'video' }>('/admin/uploads', { method: 'POST', body })
      let next: Project | Omit<Project, 'id'> = { ...editing, cover_url: result.url }
      if ('id' in editing) {
        const media = await api<ProjectMedia>(`/admin/projects/${editing.id}/media`, {
          method: 'POST',
          body: JSON.stringify({ url: result.url, kind: result.kind, alt: editing.title }),
        })
        next = { ...next, media: [...(editing.media || []), media] }
      }
      setEditing(next)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить файл')
    } finally {
      setBusy(false)
    }
  }
  async function removeMedia(mediaId: number) {
    if (!editing || !('id' in editing) || !confirm('Удалить файл из галереи?')) return
    setBusy(true)
    setError('')
    try {
      await api(`/admin/media/${mediaId}`, { method: 'DELETE' })
      setEditing({ ...editing, media: (editing.media || []).filter((item) => item.id !== mediaId) })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить медиа')
    } finally {
      setBusy(false)
    }
  }
  async function remove(id: number) {
    if (!confirm('Удалить проект?')) return
    setError('')
    try {
      await api(`/admin/projects/${id}`, { method: 'DELETE' })
      if (editing && 'id' in editing && editing.id === id) setEditing(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить проект')
    }
  }
  return <section className="admin-section"><SectionHead title="Проекты и медиа" note={`${items.length} проектов`} action={<button type="button" onClick={() => { setError(''); setEditing(emptyProject) }}>+ Добавить</button>} />
    {error && <p className="admin-error" role="alert">{error}</p>}
    {editing && <form className="editor" onSubmit={save}><h2>{'id' in editing ? 'Редактирование проекта' : 'Новый проект'}</h2><div className="editor-grid"><Field label="Название" value={editing.title} onChange={(title) => setEditing({ ...editing, title })} required /><Field label="Slug" value={editing.slug} onChange={(slug) => setEditing({ ...editing, slug })} required /><Field label="Локация" value={editing.location} onChange={(location) => setEditing({ ...editing, location })} /><Field label="Площадь" value={editing.area} onChange={(area) => setEditing({ ...editing, area })} /><Field label="Год" value={editing.year} onChange={(year) => setEditing({ ...editing, year })} /><Field label="Порядок" type="number" value={editing.sort_order} onChange={(sort_order) => setEditing({ ...editing, sort_order: Number(sort_order) || 0 })} /><label className="editor-wide">Описание<textarea rows={4} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label><label className="editor-wide">Обложка<input value={editing.cover_url} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="/uploads/… или /media/…" /><span className="upload-button">Загрузить файл<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></span></label>{editing.cover_url && <img className="editor-preview editor-wide" src={editing.cover_url} alt="Предпросмотр обложки" />}<label className="check editor-wide"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Опубликован</label>{'id' in editing && (editing.media?.length || 0) > 0 && <div className="editor-wide admin-media-list"><p>Галерея · {editing.media?.length} файлов</p><ul>{editing.media?.map((item) => <li key={item.id}><img src={item.url} alt={item.alt || ''} /><button type="button" className="danger" disabled={busy} onClick={() => removeMedia(item.id)}>Удалить</button><button type="button" disabled={busy || editing.cover_url === item.url} onClick={() => setEditing({ ...editing, cover_url: item.url })}>В обложку</button></li>)}</ul></div>}</div><EditorActions busy={busy} onCancel={() => setEditing(null)} /></form>}
    <div className="admin-card-grid">{items.map((project) => <article className="project-card-admin" key={project.id}>{project.cover_url ? <img src={project.cover_url} alt="" /> : <div className="admin-placeholder">KIT</div>}<div><span>{project.published ? 'Опубликован' : 'Черновик'}</span><h3>{project.title}</h3><p>{project.location} · {project.area ? `${project.area} м²` : 'площадь не указана'}</p><button type="button" onClick={() => { setError(''); setEditing(project) }}>Изменить</button><button type="button" className="danger" onClick={() => remove(project.id)}>Удалить</button></div></article>)}</div>{!items.length && <Empty text="Добавьте первый проект" />}</section>
}

function Texts() {
  const [items, setItems] = useState<TextSection[]>([])
  const [editing, setEditing] = useState<TextSection | Omit<TextSection, 'id'> | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const load = () => api<TextSection[]>('/admin/texts').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    setBusy(true)
    setError('')
    try {
      const hasId = 'id' in editing
      await api(hasId ? `/admin/texts/${editing.id}` : '/admin/texts', {
        method: hasId ? 'PATCH' : 'POST',
        body: JSON.stringify(textPayload(editing)),
      })
      setEditing(null)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить текст')
    } finally {
      setBusy(false)
    }
  }
  async function remove(id: number) {
    if (!confirm('Удалить текстовый блок?')) return
    setError('')
    try {
      await api(`/admin/texts/${id}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить текст')
    }
  }
  return <section className="admin-section"><SectionHead title="Тексты сайта" note="Предустановленные секции" action={<button type="button" onClick={() => { setError(''); setEditing(emptyText) }}>+ Добавить</button>} />{error && <p className="admin-error" role="alert">{error}</p>}{editing && <form className="editor" onSubmit={save}><h2>Текстовый блок</h2><div className="editor-grid"><Field label="Системный ключ" value={editing.key} onChange={(key) => setEditing({ ...editing, key })} required /><Field label="Надзаголовок" value={editing.eyebrow} onChange={(eyebrow) => setEditing({ ...editing, eyebrow })} /><label className="editor-wide">Заголовок<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label><label className="editor-wide">Текст<textarea rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></label><Field label="Текст кнопки" value={editing.cta_label} onChange={(cta_label) => setEditing({ ...editing, cta_label })} /><Field label="Ссылка кнопки" value={editing.cta_url} onChange={(cta_url) => setEditing({ ...editing, cta_url })} /><Field label="Порядок" type="number" value={editing.sort_order} onChange={(sort_order) => setEditing({ ...editing, sort_order: Number(sort_order) || 0 })} /><label className="check"><input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> Показывать</label></div><EditorActions busy={busy} onCancel={() => setEditing(null)} /></form>}<div className="text-list">{items.map((item) => <article key={item.id}><span>{item.key}</span><div><h3>{item.title || 'Без заголовка'}</h3><p>{item.body}</p></div><button type="button" onClick={() => { setError(''); setEditing(item) }}>Изменить</button><button type="button" className="icon-button" onClick={() => remove(item.id)}>×</button></article>)}</div>{!items.length && <Empty text="Текстовых блоков пока нет" />}</section>
}

function TelegramSettings() {
  const [value, setValue] = useState<Telegram>({ bot_username: '', admin_chat_ids: [], enabled: false })
  const [adminIds, setAdminIds] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api<Telegram>('/admin/telegram')
      .then((data) => { setValue(data); setAdminIds(data.admin_chat_ids.join('\n')) })
      .catch((e) => setError(e.message))
  }, [])
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const next = { ...value, admin_chat_ids: adminIds.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite) }
      await api('/admin/telegram', { method: 'PUT', body: JSON.stringify(next) })
      setValue(next)
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить Telegram')
    } finally {
      setBusy(false)
    }
  }
  return <section className="admin-section"><SectionHead title="Telegram" note="Уведомления о новых заявках" />{error && <p className="admin-error" role="alert">{error}</p>}<form className="editor narrow" onSubmit={submit}><Field label="Username бота" value={value.bot_username} onChange={(bot_username) => setValue({ ...value, bot_username })} placeholder="@kit_bot" /><label>ID администраторов<textarea rows={5} value={adminIds} onChange={(e) => setAdminIds(e.target.value)} placeholder={'123456789\n987654321'} /><small>Один числовой chat ID на строку</small></label><label className="check"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Отправлять уведомления</label><button className="admin-primary" disabled={busy}>{saved ? 'Сохранено ✓' : busy ? 'Сохраняем…' : 'Сохранить'}</button></form></section>
}

function Settings() {
  const [items, setItems] = useState<Setting[]>([])
  const [key, setKey] = useState(''); const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const load = () => api<Setting[]>('/admin/settings').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  async function add(event: FormEvent) {
    event.preventDefault()
    setError('')
    try {
      await api('/admin/settings', { method: 'POST', body: JSON.stringify({ key, value, public: true }) })
      setKey('')
      setValue('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось добавить настройку')
    }
  }
  async function patch(item: Setting, next: string) {
    setError('')
    try {
      await api(`/admin/settings/${item.id}`, { method: 'PATCH', body: JSON.stringify({ ...item, value: next }) })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить настройку')
    }
  }
  async function remove(id: number) {
    if (!confirm('Удалить настройку?')) return
    setError('')
    try {
      await api(`/admin/settings/${id}`, { method: 'DELETE' })
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось удалить настройку')
    }
  }
  return <section className="admin-section"><SectionHead title="Настройки" note="Публичные контакты и параметры" />{error && <p className="admin-error" role="alert">{error}</p>}<form className="setting-add" onSubmit={add}><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Ключ" required /><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Значение" required /><button>Добавить</button></form><div className="settings-list">{items.map((item) => <div key={item.id}><label>{item.key}<input defaultValue={item.value} onBlur={(e) => e.target.value !== item.value && patch(item, e.target.value)} /></label><span>{item.public ? 'public' : 'private'}</span><button type="button" className="icon-button" onClick={() => remove(item.id)}>×</button></div>)}</div></section>
}

function SectionHead({ title, note, action }: { title: string; note: string; action?: React.ReactNode }) { return <header className="admin-section-head"><div><p>{note}</p><h1>{title}</h1></div>{action}</header> }
function Empty({ text }: { text: string }) { return <div className="admin-empty">{text}</div> }
function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} /></label> }
function EditorActions({ onCancel, busy }: { onCancel: () => void; busy?: boolean }) {
  return <div className="editor-actions"><button type="button" onClick={onCancel} disabled={busy}>Отмена</button><button className="admin-primary" disabled={busy}>{busy ? 'Сохраняем…' : 'Сохранить'}</button></div>
}

export default function AdminApp() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [view, setView] = useState<View>('leads')
  useEffect(() => { api('/admin/leads').then(() => setAuthorized(true)).catch(() => setAuthorized(false)) }, [])
  if (authorized === null) return <div className="admin-loading">KIT</div>
  if (!authorized) return <Login onLogin={() => setAuthorized(true)} />
  const views: Record<View, React.ReactNode> = { leads: <Leads />, projects: <Projects />, texts: <Texts />, telegram: <TelegramSettings />, settings: <Settings /> }
  async function logout() { await api('/admin/logout', { method: 'POST' }); setAuthorized(false) }
  return <div className="admin-shell"><aside><a className="admin-logo" href="/">KIT<span>admin</span></a><nav>{(Object.keys(labels) as View[]).map((key) => <button className={view === key ? 'active' : ''} key={key} onClick={() => setView(key)}>{labels[key]}</button>)}</nav><div><a href="/" target="_blank">Открыть сайт ↗</a><button onClick={logout}>Выйти</button></div></aside><main><div className="admin-mobile-bar"><span>KIT / admin</span><select value={view} onChange={(e) => setView(e.target.value as View)}>{(Object.keys(labels) as View[]).map((key) => <option value={key} key={key}>{labels[key]}</option>)}</select></div>{views[view]}</main></div>
}
