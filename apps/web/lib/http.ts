import type { ApiErrorDetail } from "@/lib/types"

const DEFAULT_API_BASE_URL = "http://localhost:8000"

export class ApiRequestError extends Error {
  readonly status: number
  readonly code: string
  readonly field?: string

  constructor(status: number, detail: ApiErrorDetail) {
    super(detail.message)
    this.name = "ApiRequestError"
    this.status = status
    this.code = detail.code
    this.field = detail.field
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  baseUrl = DEFAULT_API_BASE_URL,
): Promise<T> {
  const url = new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`)
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  })

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null)
    const detail = readErrorDetail(payload, response.status)
    throw new ApiRequestError(response.status, detail)
  }

  return (await response.json()) as T
}

export function browserApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, init, process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL)
}

export function serverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (typeof window !== "undefined") {
    throw new Error("serverApiFetch can only be called from the Next.js server.")
  }
  return apiFetch<T>(path, init, process.env.API_SERVER_BASE_URL || DEFAULT_API_BASE_URL)
}

function readErrorDetail(payload: unknown, status: number): ApiErrorDetail {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const detail = payload.detail
    if (
      typeof detail === "object" &&
      detail !== null &&
      "code" in detail &&
      "message" in detail &&
      typeof detail.code === "string" &&
      typeof detail.message === "string"
    ) {
      return {
        code: detail.code,
        message: detail.message,
        field: "field" in detail && typeof detail.field === "string" ? detail.field : undefined,
      }
    }
  }

  return { code: "request_failed", message: `The request failed with status ${status}.` }
}
