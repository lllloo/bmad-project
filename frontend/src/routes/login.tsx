import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { api, setAccessToken } from '../lib/api'

// W0 spike — 最簡 login form
//   - 故意用 useState（不 zod / react-hook-form），spike 不驗 form lib
//   - 故意不做 a11y polish / loading state / error toast，留 Story 1.7 + Story 2.x
function LoginPage() {
  const [email, setEmail] = useState('jie@example.com')
  const [password, setPassword] = useState('password123')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const { data } = await api.post<{ access_token: string }>('/auth/login', { email, password })
      setAccessToken(data.access_token)
      navigate({ to: '/me' })
    } catch (err) {
      const ax = err as AxiosError<{ message?: string }>
      setError(ax.response?.data?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 360, margin: '4rem auto', fontFamily: 'sans-serif' }}>
      <h1>W0 spike — Login</h1>
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            required
          />
        </label>
        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        <button type="submit" disabled={submitting} style={{ width: '100%', padding: 10 }}>
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        Spike 預設 user：jie@example.com / password123（W0 seeder 建）
      </p>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
})
