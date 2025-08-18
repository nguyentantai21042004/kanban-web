export interface AdminRole {
  id: string
  name: string
  alias: string
}

export interface AdminUserItem {
  id: string
  email: string
  full_name: string
  role: AdminRole
  is_active: boolean
  created_at: string
  updated_at: string
  last_login_at?: string | null
}

export interface AdminPaginatorMeta {
  count: number
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

export interface AdminDashboardActivityPoint {
  date: string // YYYY-MM-DD
  cards_created: number
  cards_completed: number
}

export interface AdminDashboardData {
  users: { total: number; active: number; growth: number }
  boards: { total: number; active: number }
  cards: { total: number; completed: number; overdue: number }
  activity: AdminDashboardActivityPoint[]
}

export interface AdminDashboardResponse {
  error_code: number
  message: string
  data: AdminDashboardData
}

export interface AdminUsersResponse {
  error_code: number
  message: string
  data: { items: AdminUserItem[]; meta: AdminPaginatorMeta }
}

export interface AdminHealthData {
  api_status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number
  uptime_percentage: number
  websocket_connections: number
  websocket_messages_per_sec: number
  websocket_avg_latency_ms?: number
  checked_at: string
}

export interface AdminHealthResponse {
  error_code: number
  message: string
  data: AdminHealthData
}

export interface GetAdminUsersParams {
  search?: string
  page?: number
  limit?: number
}

export interface CreateAdminUserRequest {
  email: string
  full_name: string
  role_id?: string
  role_alias?: string
  password?: string
}

export interface UpdateAdminUserRequest {
  full_name?: string
  role_id?: string
  role_alias?: string
  is_active?: boolean
}


