import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { AxiosError } from 'axios'
import { api } from '../../lib/api'

// W0 spike — `/me` 顯示目前登入 user 資料
//   - 直接 useEffect + axios，未抽 hooks（spike 不驗 data layer pattern）
type SpikeUser = {
  id: number
  email: string
  name: string
}

function MePage() {
  const [user, setUser] = useState<SpikeUser | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .get<SpikeUser>('/me-spike')
      .then((res) => setUser(res.data))
      .catch((err: AxiosError<{ message?: string }>) =>
        setError(err.response?.data?.message ?? err.message),
      )
  }, [])

  if (error) {
    return (
      <div style={{ padding: 24, color: 'crimson' }}>
        <h2>無法載入 /me</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!user) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>Hello, {user.email}</h1>
      <pre style={{ background: '#f5f5f5', padding: 16 }}>{JSON.stringify(user, null, 2)}</pre>
      <p style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
        若你看到這頁、且 access token 過期後仍能維持顯示，代表 axios 401 interceptor 概念驗證通過（AC5）。
      </p>
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/me')({
  component: MePage,
})
