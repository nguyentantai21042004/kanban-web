"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { apiClient } from "@/lib/api/index"
import type { Board } from "@/lib/types"
import { Plus, Search, Loader2, User, LogOut } from "lucide-react"

export default function BoardsPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [boards, setBoards] = useState<Board[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBoardName, setNewBoardName] = useState("")
  const [newBoardDescription, setNewBoardDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  
  // Ref for intersection observer
  const observerRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  // Debounce search keyword
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState(searchKeyword)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchKeyword])

  const loadBoards = useCallback(async (reset = false) => {
    // Prevent duplicate calls
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      
      if (reset) {
        setIsLoading(true)
        setCurrentPage(1)
        setBoards([])
      } else {
        setIsLoadingMore(true)
      }

      const response = await apiClient.boards.getBoards({
        keyword: debouncedSearchKeyword || undefined,
        page: reset ? 1 : currentPage + 1,
        limit: 10,
      })

      // Check response format
      if (response.error_code !== 0) {
        throw new Error(response.message || "Failed to load boards")
      }

      const { items, meta } = response.data
      
      if (reset) {
        setBoards(items || [])
      } else {
        setBoards(prev => [...prev, ...(items || [])])
      }
      
      setCurrentPage(reset ? 1 : currentPage + 1)
      setTotalPages(meta.total_pages)
      setHasMore(meta.current_page < meta.total_pages)
    } catch (error: any) {
      setError("Không thể tải danh sách boards")
      if (reset) {
        setBoards([])
      }
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [debouncedSearchKeyword, currentPage])

  const refreshBoards = useCallback(async () => {
    try {
      setIsLoading(true)
      setCurrentPage(1)
      setBoards([])

      const response = await apiClient.boards.getBoards({
        keyword: debouncedSearchKeyword || undefined,
        page: 1,
        limit: 10,
      })

      if (response.error_code !== 0) {
        throw new Error(response.message || "Failed to load boards")
      }

      const { items, meta } = response.data
      setBoards(items || [])
      setCurrentPage(1)
      setTotalPages(meta.total_pages)
      setHasMore(meta.current_page < meta.total_pages)
    } catch (error: any) {
      setError("Không thể tải danh sách boards")
      setBoards([])
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearchKeyword])

  // Load boards when debounced search keyword changes
  useEffect(() => {
    refreshBoards()
  }, [debouncedSearchKeyword])

  // Initial load only once
  useEffect(() => {
    refreshBoards()
  }, []) // Empty dependency array for initial load only

  // Infinite scroll handler
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && !isLoadingRef.current) {
          loadBoards(false)
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, loadBoards])

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")

    try {
      await apiClient.boards.createBoard({
        name: newBoardName,
        description: newBoardDescription || undefined,
      })

      await refreshBoards()
      setIsCreateDialogOpen(false)
      setNewBoardName("")
      setNewBoardDescription("")
    } catch (error: any) {
      setError(error.message || "Không thể tạo board mới")
    } finally {
      setIsCreating(false)
    }
  }

  const handleBoardClick = (boardId: string) => {
    router.push(`/board/${boardId}`)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Simple header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div>
              <h1
                className="text-lg font-semibold text-gray-900 select-none"
                onClick={(function () {
                  let clicks = 0
                  let timer: number | undefined
                  return () => {
                    clicks += 1
                    if (!timer) {
                      timer = window.setTimeout(() => {
                        clicks = 0
                        timer = undefined
                      }, 5000)
                    }
                    if (clicks >= 10) {
                      clicks = 0
                      if (timer) {
                        window.clearTimeout(timer)
                        timer = undefined
                      }
                      // Log current user when unlocking admin via easter egg
                      console.log("🔓 Admin easter egg unlocked. Current user:", user)
                      router.push('/admin')
                    }
                  }
                })()}
                title=""
              >
                Kanban
              </h1>
              <p className="text-sm text-gray-600">{user?.full_name}</p>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={() => router.push("/profile")}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>

              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Đăng xuất
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple welcome */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Projects</h2>
          <p className="text-gray-600">Quản lý các dự án của bạn</p>
        </div>

        {/* Clean search and create */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Tìm kiếm projects..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10">
                <Plus className="h-4 w-4 mr-2" />
                Tạo mới
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={handleCreateBoard}>
                <DialogHeader>
                  <DialogTitle>Tạo Project Mới</DialogTitle>
                  <DialogDescription>Tạo một project mới để quản lý công việc</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="board-name">Tên Project</Label>
                    <Input
                      id="board-name"
                      placeholder="Ví dụ: Website E-commerce"
                      value={newBoardName}
                      onChange={(e) => setNewBoardName(e.target.value)}
                      required
                      disabled={isCreating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="board-description">Mô tả (tùy chọn)</Label>
                    <Textarea
                      id="board-description"
                      placeholder="Mô tả ngắn về project..."
                      value={newBoardDescription}
                      onChange={(e) => setNewBoardDescription(e.target.value)}
                      disabled={isCreating}
                      rows={3}
                    />
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Simple boards grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : !boards || boards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              {searchKeyword ? "Không tìm thấy project nào" : "Chưa có project nào"}
            </div>
            {!searchKeyword && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tạo Project Đầu Tiên
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <Card
                key={board.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                onClick={() => handleBoardClick(board.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium line-clamp-1">{board.name}</CardTitle>
                  {board.description && (
                    <CardDescription className="line-clamp-2 text-sm">{board.description}</CardDescription>
                  )}
                </CardHeader>
                
                {/* Created by info in separate line */}
                {board.created_by && (
                  <div className="px-6 pb-3">
                    <div className="flex items-center justify-end space-x-1">
                      <User className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {board.created_by.name}
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
            {isLoadingMore && (
              <div className="col-span-full text-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            )}
            {!hasMore && boards.length > 0 && (
              <div className="col-span-full text-center py-4 text-gray-500 text-sm">
                Đã tải hết
              </div>
            )}
          </div>
        )}
        <div ref={observerRef} />
      </div>
    </div>
  )
}
