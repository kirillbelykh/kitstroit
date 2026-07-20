import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import './admin.css'

type View = 'leads' | 'projects' | 'texts' | 'telegram' | 'settings'
type Lead = { id: number; name: string; phone: string; project_type?: string; message?: string; status: 'new' | 'in_progress' | 'won' | 'lost'; created_at: string }
type Project = { id: number; slug: string; title: string; summary: string; location: string; area: string | number; year: string | number; cover_url: string; sort_order: number; published: boolean }
type TextSection = { id: number; key: string; eyebrow: string; title: string; body: string; cta_label: string; cta_url: string; sort_order: number; enabled: boolean }
type Setting = { id: number; key: string; value: string; public: boolean }
type Telegram = { bot_username: string; admin_chat_ids: number[]; enabled: boolean }

const labels: Record<View, string> = { leads: 'Заявки', projects: 'Проекты и медиа', texts: 'Тексты', telegram: 'Telegram', settings: 'Настройки' }
const emptyProject: Omit<Project, 'id'> = { slug: '', title: '', summary: '', location: '', area: '', year: new Date().getFullYear(), cover_url: '', sort_order: 0, published: false }
const emptyText: Omit<TextSection, 'id'> = { key: '', eyebrow: '', title: '', body: '', cta_label: '', cta_url: '', sort_order: 0, enabled: true }

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

function Leads() {
  const [items, setItems] = useState<Lead[]>([])
  const [error, setError] = useState('')
  const load = () => api<Lead[]>('/admin/leads').then(setItems).catch((e) => setError(e.message))
  useEffect(() => { load() }, [])
  async function change(id: number, status: Lead['status']) { await api(`/admin/leads/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load() }
  async function remove(id: number) { if (!confirm('Удалить заявку?')) return; await api(`/admin/leads/${id}`, { method: 'DELETE' }); load() }
  return <section className="admin-section"><SectionHead title="Заявки" note={`${items.length} всего`} /><div className="admin-table-wrap"><table><thead><tr><th>Дата</th><th>Клиент</th><th>Проект</th><th>Сообщение</th><th>Статус</th><th /></tr></thead><tbody>{items.map((lead) => <tr key={lead.id}><td>{new Date(lead.created_at).toLocaleString('ru-RU')}</td><td><strong>{lead.name}</strong><a href={`tel:${lead.phone}`}>{lead.phone}</a></td><td>{lead.project_type || '—'}</td><td className="admin-message">{lead.message || '—'}</td><td><select value={lead.status} onChange={(e) => change(lead.id, e.target.value as Lead['status'])}><option value="new">Новая</option><option value="in_progress">В работе</option><option value="won">Успех</option><option value="lost">Закрыта</option></select></td><td><button className="icon-button" onClick={() => remove(lead.id)} aria-label="Удалить заявку">×</button></td></tr>)}</tbody></table>{!items.length && !error && <Empty text="Заявок пока нет" />}{error && <p className="admin-error">{error}</p>}</div></section>
}

function Projects() {
  const [items, setItems] = useState<Project[]>([])
  const [editing, setEditing] = useState<Project | Omit<Project, 'id'> | null>(null)
  const load = () => api<Project[]>('/admin/projects').then(setItems)
  useEffect(() => { load() }, [])
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return
    const method = 'id' in editing ? 'PATCH' : 'POST'; const path = 'id' in editing ? `/admin/projects/${editing.id}` : '/admin/projects'
    await api(path, { method, body: JSON.stringify(editing) }); setEditing(null); load()
  }
  async function upload(file: File) {
    if (!editing) return
    const body = new FormData(); body.append('file', file)
    const result = await api<{ url: string; kind: 'image' | 'video' }>('/admin/uploads', { method: 'POST', body })
    if ('id' in editing) await api(`/admin/projects/${editing.id}/media`, { method: 'POST', body: JSON.stringify({ url: result.url, kind: result.kind, alt: editing.title }) })
    setEditing({ ...editing, cover_url: result.url })
  }
  async function remove(id: number) { if (!confirm('Удалить проект?')) return; await api(`/admin/projects/${id}`, { method: 'DELETE' }); load() }
  return <section className="admin-section"><SectionHead title="Проекты и медиа" note={`${items.length} проектов`} action={<button onClick={() => setEditing(emptyProject)}>+ Добавить</button>} />
    {editing && <form className="editor" onSubmit={save}><h2>{'id' in editing ? 'Редактирование проекта' : 'Новый проект'}</h2><div className="editor-grid"><Field label="Название" value={editing.title} onChange={(title) => setEditing({ ...editing, title })} required /><Field label="Slug" value={editing.slug} onChange={(slug) => setEditing({ ...editing, slug })} required /><Field label="Локация" value={editing.location} onChange={(location) => setEditing({ ...editing, location })} /><Field label="Площадь" value={editing.area} onChange={(area) => setEditing({ ...editing, area })} /><Field label="Год" value={editing.year} onChange={(year) => setEditing({ ...editing, year })} /><Field label="Порядок" type="number" value={editing.sort_order} onChange={(sort_order) => setEditing({ ...editing, sort_order: Number(sort_order) })} /><label className="editor-wide">Описание<textarea rows={4} value={editing.summary} onChange={(e) => setEditing({ ...editing, summary: e.target.value })} /></label><label className="editor-wide">Обложка<input value={editing.cover_url} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="/uploads/…" /><span className="upload-button">Загрузить файл<input type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></span></label>{editing.cover_url && <img className="editor-preview editor-wide" src={editing.cover_url} alt="Предпросмотр обложки" />}<label className="check editor-wide"><input type="checkbox" checked={editing.published} onChange={(e) => setEditing({ ...editing, published: e.target.checked })} /> Опубликован</label></div><EditorActions onCancel={() => setEditing(null)} /></form>}
    <div className="admin-card-grid">{items.map((project) => <article className="project-card-admin" key={project.id}>{project.cover_url ? <img src={project.cover_url} alt="" /> : <div className="admin-placeholder">KIT</div>}<div><span>{project.published ? 'Опубликован' : 'Черновик'}</span><h3>{project.title}</h3><p>{project.location} · {project.area ? `${project.area} м²` : 'площадь не указана'}</p><button onClick={() => setEditing(project)}>Изменить</button><button className="danger" onClick={() => remove(project.id)}>Удалить</button></div></article>)}</div>{!items.length && <Empty text="Добавьте первый проект" />}</section>
}

function Texts() {
  const [items, setItems] = useState<TextSection[]>([])
  const [editing, setEditing] = useState<TextSection | Omit<TextSection, 'id'> | null>(null)
  const load = () => api<TextSection[]>('/admin/texts').then(setItems)
  useEffect(() => { load() }, [])
  async function save(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!editing) return; const hasId = 'id' in editing; await api(hasId ? `/admin/texts/${editing.id}` : '/admin/texts', { method: hasId ? 'PATCH' : 'POST', body: JSON.stringify(editing) }); setEditing(null); load() }
  async function remove(id: number) { if (!confirm('Удалить текстовый блок?')) return; await api(`/admin/texts/${id}`, { method: 'DELETE' }); load() }
  return <section className="admin-section"><SectionHead title="Тексты сайта" note="Предустановленные секции" action={<button onClick={() => setEditing(emptyText)}>+ Добавить</button>} />{editing && <form className="editor" onSubmit={save}><h2>Текстовый блок</h2><div className="editor-grid"><Field label="Системный ключ" value={editing.key} onChange={(key) => setEditing({ ...editing, key })} required /><Field label="Надзаголовок" value={editing.eyebrow} onChange={(eyebrow) => setEditing({ ...editing, eyebrow })} /><label className="editor-wide">Заголовок<input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></label><label className="editor-wide">Текст<textarea rows={6} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></label><Field label="Текст кнопки" value={editing.cta_label} onChange={(cta_label) => setEditing({ ...editing, cta_label })} /><Field label="Ссылка кнопки" value={editing.cta_url} onChange={(cta_url) => setEditing({ ...editing, cta_url })} /><Field label="Порядок" type="number" value={editing.sort_order} onChange={(sort_order) => setEditing({ ...editing, sort_order: Number(sort_order) })} /><label className="check"><input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> Показывать</label></div><EditorActions onCancel={() => setEditing(null)} /></form>}<div className="text-list">{items.map((item) => <article key={item.id}><span>{item.key}</span><div><h3>{item.title || 'Без заголовка'}</h3><p>{item.body}</p></div><button onClick={() => setEditing(item)}>Изменить</button><button className="icon-button" onClick={() => remove(item.id)}>×</button></article>)}</div>{!items.length && <Empty text="Текстовых блоков пока нет" />}</section>
}

function TelegramSettings() {
  const [value, setValue] = useState<Telegram>({ bot_username: '', admin_chat_ids: [], enabled: false })
  const [saved, setSaved] = useState(false)
  useEffect(() => { api<Telegram>('/admin/telegram').then(setValue) }, [])
  async function submit(event: FormEvent) { event.preventDefault(); await api('/admin/telegram', { method: 'PUT', body: JSON.stringify(value) }); setSaved(true); setTimeout(() => setSaved(false), 2200) }
  return <section className="admin-section"><SectionHead title="Telegram" note="Уведомления о новых заявках" /><form className="editor narrow" onSubmit={submit}><Field label="Username бота" value={value.bot_username} onChange={(bot_username) => setValue({ ...value, bot_username })} placeholder="@kit_bot" /><label>ID администраторов<textarea rows={5} value={value.admin_chat_ids.join('\n')} onChange={(e) => setValue({ ...value, admin_chat_ids: e.target.value.split(/[\s,]+/).filter(Boolean).map(Number).filter(Number.isFinite) })} placeholder={'123456789\n987654321'} /><small>Один числовой chat ID на строку</small></label><label className="check"><input type="checkbox" checked={value.enabled} onChange={(e) => setValue({ ...value, enabled: e.target.checked })} /> Отправлять уведомления</label><button className="admin-primary">{saved ? 'Сохранено ✓' : 'Сохранить'}</button></form></section>
}

function Settings() {
  const [items, setItems] = useState<Setting[]>([])
  const [key, setKey] = useState(''); const [value, setValue] = useState('')
  const load = () => api<Setting[]>('/admin/settings').then(setItems)
  useEffect(() => { load() }, [])
  async function add(event: FormEvent) { event.preventDefault(); await api('/admin/settings', { method: 'POST', body: JSON.stringify({ key, value, public: true }) }); setKey(''); setValue(''); load() }
  async function patch(item: Setting, next: string) { await api(`/admin/settings/${item.id}`, { method: 'PATCH', body: JSON.stringify({ ...item, value: next }) }); load() }
  async function remove(id: number) { if (!confirm('Удалить настройку?')) return; await api(`/admin/settings/${id}`, { method: 'DELETE' }); load() }
  return <section className="admin-section"><SectionHead title="Настройки" note="Публичные контакты и параметры" /><form className="setting-add" onSubmit={add}><input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Ключ" required /><input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Значение" required /><button>Добавить</button></form><div className="settings-list">{items.map((item) => <div key={item.id}><label>{item.key}<input defaultValue={item.value} onBlur={(e) => e.target.value !== item.value && patch(item, e.target.value)} /></label><span>{item.public ? 'public' : 'private'}</span><button className="icon-button" onClick={() => remove(item.id)}>×</button></div>)}</div></section>
}

function SectionHead({ title, note, action }: { title: string; note: string; action?: React.ReactNode }) { return <header className="admin-section-head"><div><p>{note}</p><h1>{title}</h1></div>{action}</header> }
function Empty({ text }: { text: string }) { return <div className="admin-empty">{text}</div> }
function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean; placeholder?: string }) { return <label>{label}<input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} /></label> }
function EditorActions({ onCancel }: { onCancel: () => void }) { return <div className="editor-actions"><button type="button" onClick={onCancel}>Отмена</button><button className="admin-primary">Сохранить</button></div> }

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
