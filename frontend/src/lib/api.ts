import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

/**
 * W0 spike — axios + JWT 401 interceptor 概念驗證
 *
 * 重要紀律（PRD Anti-Pattern + ADR 0002）：
 *  - access token **禁** localStorage / sessionStorage
 *  - access token 存 module-level 變數 + React Context 廣播（這裡只管 module）
 *  - refresh token 完全由 backend httpOnly cookie 管理，前端**看不到**
 *
 * spike 限制（待 Epic 2 Story 2.2 補完整版）：
 *  - 不做 retry queue / mutex / promise pool（單一 401 retry 概念驗證）
 *  - 多並發 401 場景**不**處理（會多次 hit refresh endpoint）
 *  - 不做 backoff / exponential retry
 */

let accessToken: string | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export const api: AxiosInstance = axios.create({
  baseURL: '/api',
  withCredentials: true, // 帶 httpOnly cookie（將來 refresh 用）
  timeout: 10_000,
})

// ---- Request interceptor：附 Bearer token ----
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// ---- Response interceptor：偵測 401 → refresh → retry once ----
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retried?: boolean }

    // 已 retry 過或非 401 → 不再嘗試
    if (!original || original._retried || error.response?.status !== 401) {
      return Promise.reject(error)
    }

    // 避開 refresh endpoint 自己 401 後再呼叫自己造成迴圈
    if (original.url?.includes('/auth/refresh-spike') || original.url?.includes('/auth/login')) {
      return Promise.reject(error)
    }

    original._retried = true

    try {
      const { data } = await axios.post(
        '/api/auth/refresh-spike',
        {},
        { withCredentials: true },
      )
      const newToken = data?.access_token as string | undefined
      if (!newToken) {
        return Promise.reject(error)
      }
      setAccessToken(newToken)
      original.headers = original.headers ?? {}
      ;(original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`
      return api.request(original)
    } catch (refreshError) {
      setAccessToken(null)
      return Promise.reject(refreshError)
    }
  },
)
