"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    const allowedRoles = ["admin", "Super Admin"]
    if (!allowedRoles.includes(user.role)) {
      router.replace("/boards");
    }
  }, [isLoading, user, router]);

  const allowedRoles = ["admin", "Super Admin"]
  if (isLoading || !user || !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <h1 className="text-lg font-semibold text-gray-900">Admin</h1>
            <div className="text-sm text-gray-600">{user.full_name}</div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Người dùng</TabsTrigger>
            <TabsTrigger value="analytics">Thống kê</TabsTrigger>
            <TabsTrigger value="monitoring">Hệ thống</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tạo người dùng</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Họ và tên</Label>
                    <Input placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="space-y-2">
                    <Label>Mật khẩu tạm (tùy chọn)</Label>
                    <Input type="password" placeholder="********" />
                  </div>
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <Input placeholder="admin hoặc user" />
                  </div>
                  <div className="flex gap-3">
                    <Button>Tạo</Button>
                    <Button variant="outline">Gửi lời mời</Button>
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
                  <Input placeholder="Tìm theo email / tên ..." />
                  <div className="grid grid-cols-1 gap-2">
                    <Button variant="outline">Khóa tài khoản</Button>
                    <Button variant="outline">Reset mật khẩu</Button>
                    <Button variant="outline">Đổi vai trò</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>DAU/MAU</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">—</div>
                  <div className="text-sm text-gray-500">Người dùng hoạt động</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cards mới / ngày</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">—</div>
                  <div className="text-sm text-gray-500">Tăng trưởng nội dung</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Overdue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold">—</div>
                  <div className="text-sm text-gray-500">Card quá hạn</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">Độ trễ, tỉ lệ lỗi</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>WebSocket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">Kết nối, thông điệp trên giây</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


