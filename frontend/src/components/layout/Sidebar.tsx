import { Link } from '@tanstack/react-router'

// W0 spike — 最簡 Sidebar
//   - 完整 shadcn-admin Sidebar（collapsible / 多層 menu / icon set）留 Story 1.3
export function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        background: '#1f1f23',
        color: '#f5f5f5',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 12 }}>bmad-project (spike)</div>
      <Link
        to="/me"
        style={{
          color: '#f5f5f5',
          textDecoration: 'none',
          padding: '6px 8px',
          borderRadius: 4,
        }}
        activeProps={{
          style: { background: '#2f2f33' },
        }}
      >
        Me
      </Link>
    </aside>
  )
}
