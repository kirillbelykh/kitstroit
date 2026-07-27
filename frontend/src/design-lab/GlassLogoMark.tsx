import { useEffect, useState, type CSSProperties } from 'react'
import { GlassObject, createGlassObject } from '../components/canvasui/GlassObject'

export type GlassLogoSize = 'hero' | 'nav'

type GlassLogoMarkProps = {
  src: string
  label: string
  size: GlassLogoSize
  theme: 'light' | 'dark'
  className?: string
}

const GLASS_SHARED = {
  ior: 1.45,
  thickness: 2.2,
  roughness: 0.45,
  dispersion: 0.25,
  clearcoat: 0.3,
  tint: '#E9E5DA',
  tintDensity: 0.55,
  highlight: '#C4B59A',
  depth: 0.14,
  bevel: 0.55,
  environmentIntensity: 0.85,
  floatIntensity: 0,
  rotationIntensity: 0,
  autoRotate: false,
  zoom: false,
} as const

let webglProbe: boolean | null = null

function probeWebGL(): boolean {
  if (webglProbe !== null) return webglProbe
  if (typeof document === 'undefined') {
    webglProbe = false
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    const instance = createGlassObject(
      { canvas },
      { src: '', floatIntensity: 0, rotationIntensity: 0, orbit: false, autoRotate: false },
    )
    if (!instance) {
      webglProbe = false
      return false
    }
    instance.destroy()
    webglProbe = true
    return true
  } catch {
    webglProbe = false
    return false
  }
}

function prefersStaticLogo(): boolean {
  if (typeof window === 'undefined') return false
  return matchMedia('(prefers-reduced-motion: reduce)').matches
}

export default function GlassLogoMark({ src, label, size, theme, className = '' }: GlassLogoMarkProps) {
  const [failed, setFailed] = useState(false)
  const [webglOk, setWebglOk] = useState(() => (typeof window === 'undefined' ? true : probeWebGL()))
  const [staticMotion, setStaticMotion] = useState(() => prefersStaticLogo())

  useEffect(() => {
    setWebglOk(probeWebGL())
    setStaticMotion(prefersStaticLogo())
  }, [])

  const isHero = size === 'hero'
  const showFallback = failed || !webglOk || staticMotion

  const shellStyle: CSSProperties = {
    width: '100%',
    height: '100%',
  }

  if (showFallback) {
    return (
      <div
        className={`glass-logo-mark glass-logo-mark--fallback glass-logo-mark--${size} ${className}`.trim()}
        style={shellStyle}
        role="img"
        aria-label={label}
      >
        <img src={src} alt="" className="glass-logo-mark__svg" />
      </div>
    )
  }

  return (
    <div
      className={`glass-logo-mark glass-logo-mark--glass glass-logo-mark--${size} ${className}`.trim()}
      style={shellStyle}
      role="img"
      aria-label={label}
    >
      <GlassObject
        src={src}
        className="glass-logo-mark__canvas"
        style={{ width: '100%', height: '100%' }}
        {...GLASS_SHARED}
        floatIntensity={0}
        rotationIntensity={0}
        autoRotate={false}
        orbit={isHero}
        background={theme === 'light' ? '#e9e5da' : '#11120f'}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
