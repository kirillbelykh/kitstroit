export type LabVariant = {
  path: string
  label: string
}

export const LAB_VARIANTS: LabVariant[] = [
  { path: '/test', label: 'Maddock Editorial' },
  { path: '/design-lab/craft', label: 'S&A Craft' },
  { path: '/design-lab/signature', label: 'Signature' },
  { path: '/design-lab/signature-canvas', label: 'Signature + Canvas' },
  { path: '/design-lab/nordic', label: 'Nordic Quiet (extra)' },
  { path: '/design-lab/ledger', label: 'Technical Ledger (extra)' },
  { path: '/design-lab/logo-glass', label: 'Glass logo' },
]

export function isLabPath(path: string): boolean {
  return path === '/test' || path.startsWith('/design-lab')
}
