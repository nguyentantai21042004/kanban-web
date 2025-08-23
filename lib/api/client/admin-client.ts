import { BaseClient } from './base-client'
import type {
  AdminDashboardResponse,
  AdminUsersResponse,
  AdminHealthResponse,
  AdminRolesResponse,
  GetAdminUsersParams,
  CreateAdminUserRequest,
  UpdateAdminUserRequest,
} from '../types/admin.types'

export class AdminClient extends BaseClient {
  async getDashboard(period: '7d' | '30d' | '90d' = '7d'): Promise<AdminDashboardResponse> {
    return this.request<AdminDashboardResponse>(this.createUrlWithParams('/admin/dashboard', { period }))
  }

  async getUsers(params: GetAdminUsersParams = {}): Promise<AdminUsersResponse> {
    return this.request<AdminUsersResponse>(this.createUrlWithParams('/admin/users', params))
  }

  async getRoles(): Promise<AdminRolesResponse> {
    return this.request<AdminRolesResponse>('/admin/roles')
  }

  async createUser(body: CreateAdminUserRequest): Promise<any> {
    return this.request<any>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async updateUser(userId: string, body: UpdateAdminUserRequest): Promise<any> {
    return this.request<any>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async getHealth(): Promise<AdminHealthResponse> {
    return this.request<AdminHealthResponse>('/admin/health')
  }
}


