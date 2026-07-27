import { PHONE_DISPLAY, PHONE_LINK } from '../components'

export const LAB_PHONE = PHONE_DISPLAY
export const LAB_PHONE_LINK = PHONE_LINK
export const LAB_TELEGRAM = '@kitstroit'
export const LAB_TELEGRAM_LINK = 'https://t.me/kitstroit'

export const LAB_GEO = 'Санкт-Петербург и Ленинградская область'

export const LAB_SERVICE =
  'Проектируем и строим современные загородные дома под ключ с фиксированной сметой и гарантией 10 лет.'

export type LabProject = {
  title: string
  place: string
  area: string
  status: 'Готовый объект' | 'Концепция'
  image: string
  summary: string
}

export const LAB_PROJECTS: LabProject[] = [
  {
    title: 'Pavlov SKY',
    place: 'Санкт-Петербург / ЛО',
    area: '—',
    status: 'Готовый объект',
    image: '/media/projects/pavlov-sky/img-2085.webp',
    summary: 'Реализованный загородный дом. Реальный обзор объекта доступен на сайте.',
  },
  {
    title: 'Dom Bezobrazova / Репино',
    place: 'Репино',
    area: '—',
    status: 'Готовый объект',
    image: '/media/projects/dom-bezobrazova-repino/img-01.webp',
    summary: 'Готовый объект KIT в Репино — архитектура, детали и работа с участком.',
  },
  {
    title: 'Familia',
    place: 'Ленинградская область',
    area: '—',
    status: 'Концепция',
    image: '/media/projects/familia/img-2402.webp',
    summary: 'Концепция семейного дома: свет, дерево и спокойная планировка.',
  },
]

export const LAB_PROCESS = [
  {
    title: 'Участок и задача',
    body: 'Знакомимся с вами, участком и сценарием жизни. Фиксируем ограничения и цели.',
  },
  {
    title: 'Проект и смета',
    body: 'Согласуем архитектуру, конструктив, инженерию, этапы и стоимость до старта работ.',
  },
  {
    title: 'Команда и материалы',
    body: 'Закрепляем прораба, своих мастеров и понятный календарный план.',
  },
  {
    title: 'Строительство и сдача',
    body: 'Контролируем скрытые работы, фиксируем этапы и сдаём дом по акту.',
  },
]

export const LAB_TURNKEY = [
  {
    title: 'Фиксированная смета',
    body: 'Состав работ и стоимость фиксируются в договоре. Изменения — только письменно.',
  },
  {
    title: 'Поэтапная оплата',
    body: 'Оплачиваете принятый этап. Нет предоплаты «за всё сразу» без результата.',
  },
  {
    title: 'Гарантия 10 лет',
    body: 'Письменная гарантия на выполненные работы и сопровождение после передачи дома.',
  },
  {
    title: 'Один ответственный',
    body: 'Закреплённый прораб и свои мастера. Точки контроля на каждом этапе.',
  },
]
