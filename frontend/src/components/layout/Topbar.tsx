import { useNavigate } from '@tanstack/react-router'
import { setAccessToken } from '../../lib/api'

// W0 spike — 最簡 Topbar，只放 spike 字樣 + logout button
//   - 完整 Topbar（breadcrumbs / cmd+k / theme switch / user menu）留 Story 1.3 / 3.6
export function Topbar() {
  const navigate = useNavigate()

  function handleLogout() {
    setAccessToken(null)
    navigate({ to: '/login' })
  }

  return (
    <header
      style={{
        height: 56,
        borderBottom: '1px solid #e5e5e5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}
    >
      <div style={{ fontWeight: 600 }}>W0 Spike — Authenticated Shell</div>
      <button onClick={handleLogout} type="button" style={{ padding: '6px 12px' }}>
        Logout
      </button>
    </header>
  )
}
