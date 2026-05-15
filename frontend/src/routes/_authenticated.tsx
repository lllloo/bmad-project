import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '../components/layout/AppShell'
import { getAccessToken } from '../lib/api'

// W0 spike — authenticated layout group
//   - beforeLoad guard：沒 access token 直接 redirect /login
//   - 包進 AppShell（Sidebar / Topbar）
export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    if (!getAccessToken()) {
      throw redirect({ to: '/login' })
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
})
