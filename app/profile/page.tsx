"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api/index"
import type { User } from "@/lib/types"
import { Loader2, ArrowLeft, Save, LogOut } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false)
  const fileInputRef = useState<HTMLInputElement | null>(null)[0]
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<"info" | "password">("info")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const profileData = await apiClient.auth.getMyProfile()
      setProfile(profileData)
      setFullName(profileData.full_name)
      setAvatarUrl(profileData.avatar_url || "")
    } catch (error: any) {
      setError("Không thể tải thông tin profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const response = await apiClient.auth.updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl || undefined,
      })
      const updatedProfile = (response as any).data || response

      setProfile(updatedProfile)
      toast({ title: "Thành công", description: "Cập nhật thông tin cá nhân" })
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Cập nhật thất bại", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarClick = () => {
    // handled by dropdown
  }

  const handlePickAvatar = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = (input.files && input.files[0]) || null
      if (!file) return
      try {
        setIsSaving(true)
        const res = await apiClient.auth.uploadAvatar(file)
        const url = res?.data?.url
        if (url) {
          setAvatarUrl(url)
          await apiClient.auth.updateProfile({ full_name: fullName, avatar_url: url })
          toast({ title: "Thành công", description: "Ảnh đại diện đã được cập nhật" })
        }
      } catch (err: any) {
        toast({ title: "Lỗi", description: err.message || 'Tải ảnh thất bại', variant: "destructive" })
      } finally {
        setIsSaving(false)
      }
    }
    input.click()
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) {
      toast({ title: "Lỗi", description: "Vui lòng nhập đủ mật khẩu hiện tại và mật khẩu mới", variant: "destructive" })
      return
    }
    try {
      setIsChangingPassword(true)
      const res = await apiClient.auth.changePassword({ current_password: currentPassword, new_password: newPassword })
      if (res.error_code === 0) {
        toast({ title: "Thành công", description: "Đổi mật khẩu thành công" })
        setCurrentPassword("")
        setNewPassword("")
      } else {
        toast({ title: "Lỗi", description: res.message || "Đổi mật khẩu thất bại", variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Đổi mật khẩu thất bại", variant: "destructive" })
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-gray-600">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Quay lại
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Hồ sơ cá nhân</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="text-gray-700">
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile info */}
        <div className="mb-8 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button onClick={handleAvatarClick} className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={fullName} />
                  <AvatarFallback className="text-lg">
                    {fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase() || "NT"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={handlePickAvatar}>Đổi ảnh</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImagePreviewOpen(true)}>Xem ảnh</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <h2 className="text-2xl font-semibold text-gray-900">{profile?.full_name || fullName}</h2>
        </div>

        {/* Unified card with tabs */}
        <Card className="border-gray-200">
          <CardHeader className="text-center">
            <CardTitle className="text-lg">Tài khoản của bạn</CardTitle>
            <CardDescription>Quản lý thông tin cá nhân và bảo mật</CardDescription>
            <div className="mt-4 flex justify-center">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList>
                  <TabsTrigger value="info">Thông tin</TabsTrigger>
                  <TabsTrigger value="password">Mật khẩu</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsContent value="info" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Họ và tên</Label>
                    <Input
                      id="full_name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      disabled={isSaving}
                    />
                  </div>

                  {/* Success/error handled by toast */}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang lưu...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Lưu thay đổi
                        </>
                      )}
                    </Button>

                    <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={isSaving}>
                      Hủy
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="password" className="space-y-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Mật khẩu hiện tại</Label>
                    <Input id="current_password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isChangingPassword} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Mật khẩu mới</Label>
                    <Input id="new_password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isChangingPassword} />
                  </div>

                  {/* Success/error handled by toast */}

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang đổi...</>) : 'Đổi mật khẩu'}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Image preview dialog */}
      <Dialog open={isImagePreviewOpen} onOpenChange={setIsImagePreviewOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="w-full">
            <img src={avatarUrl || "/placeholder.svg"} alt="Avatar preview" className="w-full h-auto rounded" />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
