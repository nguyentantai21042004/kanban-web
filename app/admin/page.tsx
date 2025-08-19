"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  Users, 
  Activity, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  ArrowLeft,
  Settings,
  Heart
} from "lucide-react"
import { apiClient } from "@/lib/api"

// Mock data for development
const mockDashboardData = {
  users: { total: 245, active: 189, growth: 12 },
  boards: { total: 45, active: 38 },
  cards: { total: 1250, completed: 890, overdue: 23 },
  activity: [
    { date: "2024-01-01", cards_created: 15, cards_completed: 12 },
    { date: "2024-01-02", cards_created: 22, cards_completed: 18 },
    { date: "2024-01-03", cards_created: 18, cards_completed: 25 },
    { date: "2024-01-04", cards_created: 31, cards_completed: 20 },
    { date: "2024-01-05", cards_created: 25, cards_completed: 28 },
    { date: "2024-01-06", cards_created: 19, cards_completed: 22 },
    { date: "2024-01-07", cards_created: 28, cards_completed: 24 },
  ]
}

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isDashboardLoading, setIsDashboardLoading] = useState<boolean>(true)
  const [healthData, setHealthData] = useState<any>(null)
  const [isHealthLoading, setIsHealthLoading] = useState<boolean>(false)
  const [users, setUsers] = useState<any[]>([])
  const [isUsersLoading, setIsUsersLoading] = useState<boolean>(false)
  const [userSearch, setUserSearch] = useState<string>("")
  const [createEmail, setCreateEmail] = useState("")
  const [createFullName, setCreateFullName] = useState("")
  const [createRoleAlias, setCreateRoleAlias] = useState("")
  const [createPassword, setCreatePassword] = useState("")
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const allowedRoles = ["admin", "super_admin"]
    if (!allowedRoles.includes(user.role.alias)) {
      router.replace("/boards");
    }
  }, [isLoading, user, router]);

  const allowedRoles = ["admin", "super_admin"]
  if (isLoading || !user || !allowedRoles.includes(user.role.alias)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  // Fetch dashboard on first load
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        setIsDashboardLoading(true)
        const res = await apiClient.admin.getDashboard('7d')
        if (mounted && res?.data) setDashboardData(res.data)
      } catch (e) {
        // fallback to mock if error
        if (mounted) setDashboardData(mockDashboardData)
      } finally {
        if (mounted) setIsDashboardLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  // Fetch users when tab active or search changes
  useEffect(() => {
    if (activeTab !== 'users') return
    let mounted = true
    const load = async () => {
      try {
        setIsUsersLoading(true)
        const res = await apiClient.admin.getUsers({ search: userSearch, page: 1, limit: 20 })
        if (mounted && res?.data?.items) setUsers(res.data.items)
      } catch (e) {
        if (mounted) setUsers([])
      } finally {
        if (mounted) setIsUsersLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [activeTab, userSearch])

  // Fetch health when monitoring tab active
  useEffect(() => {
    if (activeTab !== 'monitoring') return
    let mounted = true
    const load = async () => {
      try {
        setIsHealthLoading(true)
        const res = await apiClient.admin.getHealth()
        if (mounted && res?.data) setHealthData(res.data)
      } catch (e) {
        if (mounted) setHealthData(null)
      } finally {
        if (mounted) setIsHealthLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [activeTab])

  const handleCreateUser = async () => {
    try {
      setIsCreatingUser(true)
      await apiClient.admin.createUser({
        email: createEmail,
        full_name: createFullName,
        role_alias: createRoleAlias || 'user',
        password: createPassword || undefined,
      })
      // refresh list
      const res = await apiClient.admin.getUsers({ search: userSearch, page: 1, limit: 20 })
      setUsers(res?.data?.items || [])
      setCreateEmail("")
      setCreateFullName("")
      setCreateRoleAlias("")
      setCreatePassword("")
    } finally {
      setIsCreatingUser(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/boards")}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Boards
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="secondary">{user.role.name}</Badge>
              <div className="text-sm text-gray-600">{user.full_name}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 shadow-sm">
          <nav className="mt-8 px-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "dashboard"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <BarChart3 className="mr-3 h-4 w-4" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("users")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "users"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Users className="mr-3 h-4 w-4" />
                Người dùng
              </button>
              <button
                onClick={() => setActiveTab("monitoring")}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === "monitoring"
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Activity className="mr-3 h-4 w-4" />
                Hệ thống
              </button>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tổng quan</h2>
                  <p className="text-gray-600">Thống kê và báo cáo tổng thể hệ thống</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                          <p className="text-3xl font-bold text-gray-900">{(dashboardData || mockDashboardData).users.total}</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-full">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center">
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600 font-medium">+{(dashboardData || mockDashboardData).users.growth}%</span>
                        <span className="text-sm text-gray-500 ml-1">so với tháng trước</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
                          <p className="text-3xl font-bold text-gray-900">{(dashboardData || mockDashboardData).users.active}</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-full">
                          <Activity className="h-6 w-6 text-green-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">
                          {Math.round((((dashboardData || mockDashboardData).users.active / (dashboardData || mockDashboardData).users.total) * 100))}% tổng người dùng
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tổng Cards</p>
                          <p className="text-3xl font-bold text-gray-900">{(dashboardData || mockDashboardData).cards.total}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-full">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">
                          {(dashboardData || mockDashboardData).cards.completed} hoàn thành
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Cards quá hạn</p>
                          <p className="text-3xl font-bold text-red-600">{(dashboardData || mockDashboardData).cards.overdue}</p>
                        </div>
                        <div className="p-3 bg-red-50 rounded-full">
                          <TrendingDown className="h-6 w-6 text-red-600" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className="text-sm text-gray-500">
                          {Math.round((((dashboardData || mockDashboardData).cards.overdue / (dashboardData || mockDashboardData).cards.total) * 100))}% tổng cards
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Simple Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Hoạt động 7 ngày qua</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-end space-x-2">
                      {(dashboardData || mockDashboardData).activity.map((day: any, index: number) => {
                        const activity = (dashboardData || mockDashboardData).activity
                        const maxValue = Math.max(...activity.map((d: any) => Math.max(d.cards_created, d.cards_completed)))
                        const createdHeight = (day.cards_created / maxValue) * 200
                        const completedHeight = (day.cards_completed / maxValue) * 200
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                            <div className="w-full flex justify-center space-x-1">
                              <div 
                                className="bg-blue-500 w-3 rounded-t" 
                                style={{ height: `${createdHeight}px` }}
                                title={`Tạo mới: ${day.cards_created}`}
                              />
                              <div 
                                className="bg-green-500 w-3 rounded-t" 
                                style={{ height: `${completedHeight}px` }}
                                title={`Hoàn thành: ${day.cards_completed}`}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(day.date).getDate()}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-4 flex justify-center space-x-6">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
                        <span className="text-sm text-gray-600">Cards tạo mới</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                        <span className="text-sm text-gray-600">Cards hoàn thành</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Users Tab */}
            {activeTab === "users" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h2>
                  <p className="text-gray-600">Tạo và quản lý tài khoản người dùng</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Tạo người dùng</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input placeholder="email@example.com" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Họ và tên</Label>
                        <Input placeholder="Nguyễn Văn A" value={createFullName} onChange={(e) => setCreateFullName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Mật khẩu tạm (tùy chọn)</Label>
                        <Input type="password" placeholder="********" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Vai trò</Label>
                        <Input placeholder="admin | super_admin | user" value={createRoleAlias} onChange={(e) => setCreateRoleAlias(e.target.value)} />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleCreateUser} disabled={isCreatingUser}>
                          {isCreatingUser ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Đang tạo...</>) : 'Tạo'}
                        </Button>
                        <Button variant="outline" onClick={() => { setCreateEmail(''); setCreateFullName(''); setCreateRoleAlias(''); setCreatePassword('') }}>Làm mới</Button>
                      </div>
                      <Alert>
                        <AlertDescription>
                          Đây là form mẫu. Kết nối API tạo user sẽ được thêm sau.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tìm kiếm & Quản lý</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="Tìm theo email / tên ..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                      {isUsersLoading ? (
                        <div className="flex items-center justify-center h-24 text-gray-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-auto pr-2">
                          {users.map((u) => (
                            <div key={u.id} className="flex items-center justify-between border rounded p-2">
                              <div>
                                <div className="text-sm font-medium">{u.full_name}</div>
                                <div className="text-xs text-gray-500">{u.email}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary">{u.role?.name}</Badge>
                                <Badge className={u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {u.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {users.length === 0 && (
                            <div className="text-sm text-gray-500">Không có dữ liệu</div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Monitoring Tab */}
            {activeTab === "monitoring" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Giám sát hệ thống</h2>
                  <p className="text-gray-600">Trạng thái và hiệu suất hệ thống</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Heart className="mr-2 h-5 w-5 text-green-500" />
                        API Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isHealthLoading ? (
                        <div className="flex items-center justify-center h-24 text-gray-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Trạng thái:</span>
                            <Badge className={
                              healthData?.api_status === 'healthy' ? 'bg-green-100 text-green-800'
                              : healthData?.api_status === 'degraded' ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                            }>
                              {healthData?.api_status || 'unknown'}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Độ trễ trung bình:</span>
                            <span className="text-sm font-medium">{healthData?.response_time_ms ?? '-'}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Uptime:</span>
                            <span className="text-sm font-medium">{healthData?.uptime_percentage ?? '-'}%</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Activity className="mr-2 h-5 w-5 text-blue-500" />
                        WebSocket
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isHealthLoading ? (
                        <div className="flex items-center justify-center h-24 text-gray-400">
                          <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Kết nối active:</span>
                            <span className="text-sm font-medium">{healthData?.websocket_connections ?? '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Messages/sec:</span>
                            <span className="text-sm font-medium">{healthData?.websocket_messages_per_sec ?? '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg latency:</span>
                            <span className="text-sm font-medium">{healthData?.websocket_avg_latency_ms ?? '-'}ms</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}