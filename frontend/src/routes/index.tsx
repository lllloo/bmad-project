import { createFileRoute, redirect } from '@tanstack/react-router'

// W0 spike — `/` 一律導 `/login`（spike 沒做未登入首頁）
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/login' })
  },
})
