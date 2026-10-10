export const TOKEN_KEY = 'delcom_cashflow_token'
export const BASE_URL: string = import.meta.env.DELCOM_BASEURL

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
export type QueryValue = string | number | boolean | null | undefined

export interface ApiResponse<T = unknown> {
  status: 'success' | 'fail'
  message: string
  data: T
}

export interface RequestOptions {
  method?: HttpMethod
  body?: unknown
  query?: Record<string, QueryValue>
  auth?: boolean
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

export const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const url = `${BASE_URL}${path}`
  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue
    params.append(key, String(value))
  }

  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

// FormData (mis. upload foto) dikirim apa adanya agar browser mengatur boundary multipart sendiri
const serializeBody = (body: unknown): BodyInit | undefined => {
  if (body === undefined) return undefined
  return body instanceof FormData ? body : JSON.stringify(body)
}

export async function request<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, query, auth = true } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: serializeBody(body),
    })
  } catch {
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', 0)
  }

  let payload: ApiResponse<T> | null
  try {
    payload = (await response.json()) as ApiResponse<T>
  } catch {
    payload = null
  }

  if (response.status === 401 && auth) removeToken()

  if (!response.ok || payload === null || payload.status !== 'success') {
    throw new ApiError(payload?.message ?? `Permintaan gagal (${response.status})`, response.status)
  }

  return payload
}

export const api = {
  get: <T = unknown>(path: string, query?: Record<string, QueryValue>) =>
    request<T>(path, { method: 'GET', query }),
  post: <T = unknown>(path: string, body?: unknown, options?: Pick<RequestOptions, 'auth'>) =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  delete: <T = unknown>(path: string) => request<T>(path, { method: 'DELETE' }),
}
