import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  Board,
  CreateBoardRequest,
  UpdateBoardRequest,
  GetBoardResponse,
  List,
  CreateListRequest,
  UpdateListRequest,
  GetListResponse,
  Card,
  CreateCardRequest,
  UpdateCardRequest,
  MoveCardRequest,
  GetCardResponse,
  GetCardActivitiesResponse,
  Label,
  CreateLabelRequest,
  UpdateLabelRequest,
  GetLabelResponse,
  User,
  UpdateProfileRequest,
  ApiResponse,
} from "./types"

const API_BASE_URL = "https://kanban-api.ngtantai.pro/api/v1"

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("access_token")
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }

  // Auth APIs
  async login(data: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    })
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/auth/logout", {
      method: "POST",
    })
  }

  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.request<RefreshTokenResponse>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    })
  }

  // Board APIs
  async getBoards(params?: {
    ids?: string
    keyword?: string
    page?: number
    limit?: number
  }): Promise<GetBoardResponse> {
    const searchParams = new URLSearchParams()
    if (params?.ids) searchParams.append("ids", params.ids)
    if (params?.keyword) searchParams.append("keyword", params.keyword)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    const query = searchParams.toString()
    return this.request<GetBoardResponse>(`/boards${query ? `?${query}` : ""}`)
  }

  async getBoardById(id: string): Promise<Board> {
    return this.request<Board>(`/boards/${id}`)
  }

  async createBoard(data: CreateBoardRequest): Promise<Board> {
    return this.request<Board>("/boards", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateBoard(data: UpdateBoardRequest): Promise<Board> {
    return this.request<Board>("/boards", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteBoards(ids: string[]): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/boards", {
      method: "DELETE",
      body: JSON.stringify({ "ids[]": ids }),
    })
  }

  // List APIs
  async getLists(params?: {
    ids?: string
    list_id?: string
    keyword?: string
    page?: number
    limit?: number
  }): Promise<GetListResponse> {
    const searchParams = new URLSearchParams()
    if (params?.ids) searchParams.append("ids", params.ids)
    if (params?.list_id) searchParams.append("list_id", params.list_id)
    if (params?.keyword) searchParams.append("keyword", params.keyword)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    const query = searchParams.toString()
    return this.request<GetListResponse>(`/lists${query ? `?${query}` : ""}`)
  }

  async getListById(id: string): Promise<List> {
    return this.request<List>(`/lists/${id}`)
  }

  async createList(data: CreateListRequest): Promise<List> {
    return this.request<List>("/lists", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateList(data: UpdateListRequest): Promise<List> {
    return this.request<List>("/lists", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteLists(ids: string[]): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/lists", {
      method: "DELETE",
      body: JSON.stringify({ "ids[]": ids }),
    })
  }

  // Card APIs
  async getCards(params?: {
    ids?: string
    list_id?: string
    keyword?: string
    page?: number
    limit?: number
  }): Promise<GetCardResponse> {
    const searchParams = new URLSearchParams()
    if (params?.ids) searchParams.append("ids", params.ids)
    if (params?.list_id) searchParams.append("list_id", params.list_id)
    if (params?.keyword) searchParams.append("keyword", params.keyword)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    const query = searchParams.toString()
    return this.request<GetCardResponse>(`/cards${query ? `?${query}` : ""}`)
  }

  async getCardById(id: string): Promise<Card> {
    return this.request<Card>(`/cards/${id}`)
  }

  async createCard(data: CreateCardRequest): Promise<Card> {
    return this.request<Card>("/cards", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateCard(data: UpdateCardRequest): Promise<Card> {
    return this.request<Card>("/cards", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async moveCard(data: MoveCardRequest): Promise<Card> {
    return this.request<Card>("/cards/move", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async deleteCards(ids: string[]): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/cards", {
      method: "DELETE",
      body: JSON.stringify({ "ids[]": ids }),
    })
  }

  async getCardActivities(
    cardId: string,
    params?: {
      page?: number
      limit?: number
    },
  ): Promise<GetCardActivitiesResponse> {
    const searchParams = new URLSearchParams()
    searchParams.append("card_id", cardId)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    return this.request<GetCardActivitiesResponse>(`/cards/activities?${searchParams.toString()}`)
  }

  // Label APIs
  async getLabels(params?: {
    ids?: string
    label_id?: string
    keyword?: string
    page?: number
    limit?: number
  }): Promise<GetLabelResponse> {
    const searchParams = new URLSearchParams()
    if (params?.ids) searchParams.append("ids", params.ids)
    if (params?.label_id) searchParams.append("label_id", params.label_id)
    if (params?.keyword) searchParams.append("keyword", params.keyword)
    if (params?.page) searchParams.append("page", params.page.toString())
    if (params?.limit) searchParams.append("limit", params.limit.toString())

    const query = searchParams.toString()
    return this.request<GetLabelResponse>(`/labels${query ? `?${query}` : ""}`)
  }

  async createLabel(data: CreateLabelRequest): Promise<Label> {
    return this.request<Label>("/labels", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateLabel(data: UpdateLabelRequest): Promise<Label> {
    return this.request<Label>("/labels", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteLabels(ids: string[]): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>("/labels", {
      method: "DELETE",
      body: JSON.stringify({ "ids[]": ids }),
    })
  }

  // User APIs
  async getMyProfile(): Promise<User> {
    return this.request<User>("/users/me")
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    return this.request<User>("/users/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async getUserById(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`)
  }
}

export const apiClient = new ApiClient()
