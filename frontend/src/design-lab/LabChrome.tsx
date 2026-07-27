import type { ReactNode } from 'react'
import { LAB_VARIANTS } from './lab-variants'
import './lab-chrome.css'

type LabChromeProps = {
  activePath: string
  children: ReactNode
}

export function ConfirmBadge() {
  return <span className="lab-confirm-badge">требует подтверждения</span>
}

export function KitMark({ large = false, href = '#top' }: { large?: boolean; href?: string }) {
  return (
    <a className={`lab-kit-mark${large ? ' lab-kit-mark--lg' : ''}`} href={href} aria-label="KIT">
      <span>K</span>
      <span>I</span>
      <span>T</span>
    </a>
  )
}

export default function LabChrome({ activePath, children }: LabChromeProps) {
  return (
    <div className="lab-chrome">
      <div className="lab-chrome__bar">
        <a className="lab-chrome__back" href="/">
          ← на сайт
        </a>
        <span className="lab-chrome__badge">Experimental</span>
        <nav className="lab-chrome__nav" aria-label="Design lab variants">
          {LAB_VARIANTS.map((variant) => (
            <a
              key={variant.path}
              href={variant.path}
              className={activePath === variant.path ? 'is-active' : undefined}
              aria-current={activePath === variant.path ? 'page' : undefined}
            >
              {variant.label}
            </a>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
}
