import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

// W0 spike — Minimal AppShell（簡化版抄自 satnaing/shadcn-admin layout 結構）
//   - 完整 shadcn-admin layout（tailwind config + shadcn primitives + lucide-react）留 Story 1.3
//   - 本檔目標只是「Sidebar / Topbar / Content area 結構可渲染」，視覺對齊 cream / Cormorant 也留 Story 1.3
//   - 純 inline style 而非 tailwind，避免 spike 引入 tailwind 設定 overhead
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar />
        <main style={{ flex: 1, padding: '0' }}>{children}</main>
      </div>
    </div>
  )
}
