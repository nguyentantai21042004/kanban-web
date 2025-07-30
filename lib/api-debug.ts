// API Debug Helper
// Sử dụng file này để test các API calls và xem log chi tiết

import { apiClient } from "./api"

export class ApiDebugger {
  static async testLogin() {
    console.log("🧪 TESTING LOGIN API")
    try {
      const result = await apiClient.login({
        username: "tantai",
        password: "password123"
      })
      console.log("✅ Login test successful:", result)
      
      // Kiểm tra response format
      if (result.error_code === 0) {
        console.log("✅ Response format is correct")
        console.log("📝 Access Token:", result.data.access_token ? "***" : "undefined")
        console.log("📝 User:", result.data.user)
      } else {
        console.error("❌ Response format error:", result.message)
      }
      
      return result
    } catch (error) {
      console.error("❌ Login test failed:", error)
      throw error
    }
  }

  static async testGetBoards() {
    console.log("🧪 TESTING GET BOARDS API")
    try {
      const result = await apiClient.getBoards({
        page: 1,
        limit: 10
      })
      console.log("✅ Get boards test successful:", result)
      
      // Kiểm tra response format
      if (result.error_code === 0) {
        console.log("✅ Response format is correct")
        console.log("📊 Total boards:", result.data.items?.length || 0)
        console.log("📄 Current page:", result.data.meta.current_page)
        console.log("📄 Total pages:", result.data.meta.total_pages)
      } else {
        console.error("❌ Response format error:", result.message)
      }
      
      return result
    } catch (error) {
      console.error("❌ Get boards test failed:", error)
      throw error
    }
  }

  static async testGetBoardById(id: string) {
    console.log("🧪 TESTING GET BOARD BY ID API")
    try {
      const result = await apiClient.getBoardById(id)
      console.log("✅ Get board by ID test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Get board by ID test failed:", error)
      throw error
    }
  }

  static async testCreateBoard() {
    console.log("🧪 TESTING CREATE BOARD API")
    try {
      const result = await apiClient.createBoard({
        name: "Test Board",
        description: "Test board description"
      })
      console.log("✅ Create board test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Create board test failed:", error)
      throw error
    }
  }

  static async testGetLists() {
    console.log("🧪 TESTING GET LISTS API")
    try {
      const result = await apiClient.getLists({
        page: 1,
        limit: 10
      })
      console.log("✅ Get lists test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Get lists test failed:", error)
      throw error
    }
  }

  static async testCreateList() {
    console.log("🧪 TESTING CREATE LIST API")
    try {
      const result = await apiClient.createList({
        title: "Test List",
        board_id: "test_board_id",
        position: 0
      })
      console.log("✅ Create list test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Create list test failed:", error)
      throw error
    }
  }

  static async testGetCards() {
    console.log("🧪 TESTING GET CARDS API")
    try {
      const result = await apiClient.getCards({
        page: 1,
        limit: 10
      })
      console.log("✅ Get cards test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Get cards test failed:", error)
      throw error
    }
  }

  static async testCreateCard() {
    console.log("🧪 TESTING CREATE CARD API")
    try {
      const result = await apiClient.createCard({
        title: "Test Card",
        description: "Test card description",
        list_id: "test_list_id"
      })
      console.log("✅ Create card test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Create card test failed:", error)
      throw error
    }
  }

  static async testGetLabels() {
    console.log("🧪 TESTING GET LABELS API")
    try {
      const result = await apiClient.getLabels({
        page: 1,
        limit: 10
      })
      console.log("✅ Get labels test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Get labels test failed:", error)
      throw error
    }
  }

  static async testCreateLabel() {
    console.log("🧪 TESTING CREATE LABEL API")
    try {
      const result = await apiClient.createLabel({
        name: "Test Label",
        color: "#ff0000",
        board_id: "test_board_id"
      })
      console.log("✅ Create label test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Create label test failed:", error)
      throw error
    }
  }

  static async testGetMyProfile() {
    console.log("🧪 TESTING GET MY PROFILE API")
    try {
      const result = await apiClient.getMyProfile()
      console.log("✅ Get my profile test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Get my profile test failed:", error)
      throw error
    }
  }

  static async testUpdateProfile() {
    console.log("🧪 TESTING UPDATE PROFILE API")
    try {
      const result = await apiClient.updateProfile({
        full_name: "Test User Updated"
      })
      console.log("✅ Update profile test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Update profile test failed:", error)
      throw error
    }
  }

  static async testLogout() {
    console.log("🧪 TESTING LOGOUT API")
    try {
      const result = await apiClient.logout()
      console.log("✅ Logout test successful:", result)
      return result
    } catch (error) {
      console.error("❌ Logout test failed:", error)
      throw error
    }
  }

  // Test tất cả các API
  static async testAllApis() {
    console.log("🚀 STARTING ALL API TESTS")
    console.log("=".repeat(50))
    
    try {
      // Test login first
      await this.testLogin()
      
      // Test other APIs
      await this.testGetBoards()
      await this.testGetLists()
      await this.testGetCards()
      await this.testGetLabels()
      await this.testGetMyProfile()
      
      console.log("✅ ALL API TESTS COMPLETED SUCCESSFULLY")
    } catch (error) {
      console.error("❌ SOME API TESTS FAILED:", error)
    }
  }
}

// Export để có thể sử dụng trong browser console
if (typeof window !== 'undefined') {
  (window as any).ApiDebugger = ApiDebugger
} 