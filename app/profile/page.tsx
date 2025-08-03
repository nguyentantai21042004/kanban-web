"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api"
import type { User } from "@/lib/types"
import { Loader2, ArrowLeft, Save, LogOut } from "lucide-react"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const profileData = await apiClient.getMyProfile()
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
    setError("")
    setMessage("")
    setIsSaving(true)

    try {
      const response = await apiClient.updateProfile({
        full_name: fullName,
        avatar_url: avatarUrl || undefined,
      })
      const updatedProfile = (response as any).data || response

      setProfile(updatedProfile)
      setMessage("Cập nhật thành công!")
    } catch (error: any) {
      setError(error.message || "Cập nhật thất bại")
    } finally {
      setIsSaving(false)
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
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
            </div>

            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile info */}
        <div className="mb-8 text-center">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={avatarUrl || "/placeholder.svg"} alt={fullName} />
            <AvatarFallback className="text-lg">
              {fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase() || "NT"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold text-gray-900">{profile?.full_name || "Nguyễn Tấn Tài"}</h2>
          <p className="text-gray-600">{profile?.email}</p>
        </div>

        {/* Edit form */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Chỉnh sửa thông tin</CardTitle>
            <CardDescription>Cập nhật thông tin cá nhân của bạn</CardDescription>
          </CardHeader>
          <CardContent>
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

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={profile?.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Email không thể thay đổi</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="avatar_url">URL Avatar</Label>
                <Input
                  id="avatar_url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {message && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-700">{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
