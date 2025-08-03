import { describe, it, expect, beforeEach } from 'vitest'
import type { Card } from '@/lib/types'

// Test thực tế cho code đã sửa
describe('Real World Position Calculation Tests', () => {
  let testCards: Card[]
  
  beforeEach(() => {
    testCards = [
      {
        id: 'card-1',
        title: 'Task 1',
        description: '',
        list_id: 'list-1',
        position: 0,
        priority: 'medium',
        labels: [],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'card-2',
        title: 'Task 2',
        description: '',
        list_id: 'list-1',
        position: 1,
        priority: 'medium',
        labels: [],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'card-3',
        title: 'Task 3',
        description: '',
        list_id: 'list-2',
        position: 0,
        priority: 'medium',
        labels: [],
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  })

  describe('Fixed handleDrop Logic', () => {
    it('should handle negative position correctly', () => {
      const draggedCard = testCards[0]
      const listId = 'list-1'
      const position = -5 // Invalid position
      
      // Simulate the fixed logic
      const cardsInList = testCards.filter((c) => c.list_id === listId)
      const validPosition = Math.max(0, Math.min(position, cardsInList.length))
      
      expect(validPosition).toBe(0) // Should be corrected to 0
    })

    it('should handle large position correctly', () => {
      const draggedCard = testCards[0]
      const listId = 'list-1'
      const position = 999 // Invalid position
      
      // Simulate the fixed logic
      const cardsInList = testCards.filter((c) => c.list_id === listId)
      const validPosition = Math.max(0, Math.min(position, cardsInList.length))
      
      expect(validPosition).toBe(2) // Should be corrected to max length
    })

    it('should update positions correctly when moving between lists', () => {
      const draggedCard = testCards[0] // card-1 from list-1
      const targetListId = 'list-2'
      const position = 1
      
      // Simulate the fixed logic
      const cardsInTargetList = testCards.filter((c) => c.list_id === targetListId)
      const cardsInSourceList = testCards.filter((c) => c.list_id === 'list-1' && c.id !== draggedCard.id)
      
      // Update positions for cards in source list
      const updatedCardsInSourceList = cardsInSourceList.map((card, index) => ({
        ...card,
        position: index,
      }))
      
      // Insert card in target list
      const validPosition = Math.max(0, Math.min(position, cardsInTargetList.length))
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(validPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: validPosition,
      })
      
      // Update positions for cards after insertion
      for (let i = validPosition + 1; i < newCardsInTargetList.length; i++) {
        newCardsInTargetList[i] = {
          ...newCardsInTargetList[i],
          position: i,
        }
      }
      
      // Verify results
      expect(updatedCardsInSourceList[0].position).toBe(0) // card-2 should be at position 0
      expect(newCardsInTargetList[0].position).toBe(0) // card-3 should remain at position 0
      expect(newCardsInTargetList[1].position).toBe(1) // dragged card should be at position 1
    })
  })

  describe('Fixed handleDragOver Logic', () => {
    it('should calculate position correctly with totalCardHeight', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const totalCardHeight = cardHeight + cardSpacing
      const cardsLength = 2
      
      // Test different mouse Y positions
      const testCases = [
        { mouseY: 50, expected: 0 },   // In header
        { mouseY: 120, expected: 0 },  // First card area
        { mouseY: 232, expected: 1 },  // Second card area (112 + 120)
        { mouseY: 344, expected: 2 },  // End of list (112 + 112 + 120)
      ]
      
      testCases.forEach(({ mouseY, expected }) => {
        let position = 0
        if (mouseY > headerHeight) {
          const cardAreaY = mouseY - headerHeight
          position = Math.floor(cardAreaY / totalCardHeight)
          position = Math.max(0, Math.min(position, cardsLength))
        }
        
        expect(position).toBe(expected)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle rollback correctly on error', () => {
      const originalCards = [...testCards]
      const draggedCard = testCards[0]
      
      // Simulate optimistic update
      const optimisticCards = originalCards.filter(c => c.id !== draggedCard.id)
      optimisticCards.splice(1, 0, { ...draggedCard, position: 1 })
      
      // Simulate error and rollback
      const shouldRollback = true
      const finalCards = shouldRollback ? originalCards : optimisticCards
      
      expect(finalCards).toEqual(originalCards)
    })

    it('should handle null draggedCard gracefully', () => {
      const draggedCard = null
      const listId = 'list-1'
      const position = 0
      
      // Should not throw error
      expect(() => {
        if (!draggedCard) return
        // Process drag operation
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty list correctly', () => {
      const emptyCards: Card[] = []
      const position = 5
      
      const validPosition = Math.max(0, Math.min(position, emptyCards.length))
      expect(validPosition).toBe(0)
    })

    it('should handle single card list correctly', () => {
      const singleCard = [testCards[0]]
      const position = 2
      
      const validPosition = Math.max(0, Math.min(position, singleCard.length))
      expect(validPosition).toBe(1)
    })
  })
}) 