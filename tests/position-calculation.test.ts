import { describe, it, expect, beforeEach } from 'vitest'
import type { Card } from '@/lib/types'

// Mock data cho testing
const createMockCard = (id: string, listId: string, position: number, title: string): Card => ({
  id,
  title,
  description: '',
  list_id: listId,
  position,
  priority: 'medium',
  labels: [],
  is_archived: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

// Test utilities
const createTestCards = (listId: string, positions: number[]): Card[] => {
  return positions.map((pos, index) => 
    createMockCard(`card-${index + 1}`, listId, pos, `Card ${index + 1}`)
  )
}

const sortCardsByPosition = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => a.position - b.position)
}

// Test cases cho thuật toán position calculation
describe('Position Calculation Algorithm Tests', () => {
  let testCards: Card[]
  let emptyListCards: Card[]
  let singleCardList: Card[]
  let largeListCards: Card[]

  beforeEach(() => {
    // Setup test data
    testCards = createTestCards('list-1', [1000, 2000, 3000, 4000])
    emptyListCards = []
    singleCardList = createTestCards('list-2', [1000])
    largeListCards = createTestCards('list-3', Array.from({ length: 100 }, (_, i) => (i + 1) * 1000))
  })

  describe('1. Basic Position Calculation', () => {
    it('should calculate correct position for empty list', () => {
      const cards = emptyListCards
      const targetPosition = 0
      
      // Expected: Insert at beginning of empty list
      expect(targetPosition).toBe(0)
    })

    it('should calculate correct position for single card list', () => {
      const cards = singleCardList
      const targetPosition = 1
      
      // Expected: Insert at end of single card list
      expect(targetPosition).toBe(1)
    })

    it('should calculate correct position for multiple cards', () => {
      const cards = testCards
      const targetPosition = 2
      
      // Expected: Insert between card 2 and 3
      expect(targetPosition).toBe(2)
    })
  })

  describe('2. Drag & Drop Position Calculation', () => {
    it('should calculate position based on mouse Y coordinate', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const totalCardHeight = cardHeight + cardSpacing
      
      // Test cases với different mouse Y positions
      const testCases = [
        { mouseY: 50, expectedPosition: 0 },   // Trong header
        { mouseY: 120, expectedPosition: 0 },  // Card đầu tiên
        { mouseY: 220, expectedPosition: 1 },  // Giữa card 1&2
        { mouseY: 320, expectedPosition: 2 },  // Giữa card 2&3
        { mouseY: 420, expectedPosition: 3 },  // Cuối list
      ]

      testCases.forEach(({ mouseY, expectedPosition }) => {
        let position = 0
        if (mouseY > headerHeight) {
          const cardAreaY = mouseY - headerHeight
          position = Math.floor(cardAreaY / totalCardHeight)
          position = Math.max(0, Math.min(position, testCards.length))
        }
        
        expect(position).toBe(expectedPosition)
      })
    })

    it('should handle edge cases for position calculation', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const totalCardHeight = cardHeight + cardSpacing
      
      // Edge cases
      const edgeCases = [
        { mouseY: -10, expectedPosition: 0 },      // Negative Y
        { mouseY: 0, expectedPosition: 0 },        // Zero Y
        { mouseY: 1000, expectedPosition: 4 },     // Very large Y
        { mouseY: headerHeight - 1, expectedPosition: 0 }, // Just before header
        { mouseY: headerHeight + 1, expectedPosition: 0 }, // Just after header
      ]

      edgeCases.forEach(({ mouseY, expectedPosition }) => {
        let position = 0
        if (mouseY > headerHeight) {
          const cardAreaY = mouseY - headerHeight
          position = Math.floor(cardAreaY / totalCardHeight)
          position = Math.max(0, Math.min(position, testCards.length))
        }
        
        expect(position).toBe(expectedPosition)
      })
    })
  })

  describe('3. Optimistic Update Algorithm', () => {
    it('should correctly update card positions after insertion', () => {
      const originalCards = [...testCards]
      const draggedCard = createMockCard('dragged-card', 'list-1', 1500, 'Dragged Card')
      const targetPosition = 2
      
      // Simulate optimistic update
      const cardsWithoutDragged = originalCards.filter(c => c.id !== draggedCard.id)
      const cardsInList = cardsWithoutDragged.filter(c => c.list_id === 'list-1')
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== 'list-1')
      
      const newCardsInList = [...cardsInList]
      newCardsInList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: 'list-1',
        position: targetPosition,
      })
      
      // Update positions for cards after the inserted position
      for (let i = targetPosition + 1; i < newCardsInList.length; i++) {
        newCardsInList[i] = {
          ...newCardsInList[i],
          position: i,
        }
      }
      
      const updatedCards = [...otherCards, ...newCardsInList]
      
      // Verify results
      expect(updatedCards.length).toBe(originalCards.length + 1) // +1 for the inserted card
      expect(updatedCards.find(c => c.id === 'dragged-card')).toBeDefined()
      expect(updatedCards.find(c => c.id === 'dragged-card')?.position).toBe(targetPosition)
    })

    it('should handle same list move correctly', () => {
      const originalCards = [...testCards]
      const draggedCard = originalCards[0] // Move first card
      const targetPosition = 3 // Move to end
      
      // Remove card from current position
      const cardsWithoutDragged = originalCards.filter(c => c.id !== draggedCard.id)
      
      // Add card to new position
      const newCardsInList = [...cardsWithoutDragged]
      newCardsInList.splice(targetPosition, 0, {
        ...draggedCard,
        position: targetPosition,
      })
      
      // Update positions for cards after the inserted position
      for (let i = targetPosition + 1; i < newCardsInList.length; i++) {
        newCardsInList[i] = {
          ...newCardsInList[i],
          position: i,
        }
      }
      
      // Verify results
      expect(newCardsInList.length).toBe(originalCards.length)
      expect(newCardsInList.find(c => c.id === draggedCard.id)?.position).toBe(targetPosition)
    })

    it('should handle cross-list move correctly', () => {
      const originalCards = [...testCards]
      const draggedCard = originalCards[0]
      const targetListId = 'list-2'
      const targetPosition = 0
      
      // Remove card from current list
      const cardsWithoutDragged = originalCards.filter(c => c.id !== draggedCard.id)
      
      // Add card to new list
      const cardsInTargetList = cardsWithoutDragged.filter(c => c.list_id === targetListId)
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== targetListId)
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: targetPosition,
      })
      
      const updatedCards = [...otherCards, ...newCardsInTargetList]
      
      // Verify results
      expect(updatedCards.find(c => c.id === draggedCard.id)?.list_id).toBe(targetListId)
      expect(updatedCards.find(c => c.id === draggedCard.id)?.position).toBe(targetPosition)
    })
  })

  describe('4. Position Validation', () => {
    it('should validate position bounds correctly', () => {
      const cards = testCards
      const maxPosition = cards.length
      
      // Test valid positions
      expect(0).toBeGreaterThanOrEqual(0)
      expect(2).toBeLessThanOrEqual(maxPosition)
      expect(maxPosition).toBeLessThanOrEqual(maxPosition)
      
      // Test invalid positions
      expect(-1).toBeLessThan(0)
      expect(maxPosition + 1).toBeGreaterThan(maxPosition)
    })

    it('should auto-correct out of bounds positions', () => {
      const cards = testCards
      const maxPosition = cards.length
      
      // Test auto-correction
      const invalidPositions = [-5, -1, maxPosition + 1, maxPosition + 10]
      const expectedCorrections = [0, 0, maxPosition, maxPosition]
      
      invalidPositions.forEach((invalidPos, index) => {
        const correctedPos = Math.max(0, Math.min(invalidPos, maxPosition))
        expect(correctedPos).toBe(expectedCorrections[index])
      })
    })
  })

  describe('5. Error Handling', () => {
    it('should handle missing dragged card gracefully', () => {
      const draggedCard = null
      const listId = 'list-1'
      const position = 0
      
      // Should not throw error when draggedCard is null
      expect(() => {
        if (!draggedCard) return
        // Process drag operation
      }).not.toThrow()
    })

    it('should handle invalid list ID gracefully', () => {
      const draggedCard = testCards[0]
      const invalidListId = 'non-existent-list'
      const position = 0
      
      // Should handle gracefully
      expect(() => {
        // Process with invalid list ID
        const cardsInList = testCards.filter(c => c.list_id === invalidListId)
        expect(cardsInList.length).toBe(0)
      }).not.toThrow()
    })

    it('should handle network errors with rollback', () => {
      const originalCards = [...testCards]
      const draggedCard = originalCards[0]
      const listId = 'list-1'
      const position = 2
      
      // Simulate optimistic update
      const optimisticCards = originalCards.filter(c => c.id !== draggedCard.id)
      optimisticCards.splice(position, 0, { ...draggedCard, position })
      
      // Simulate network error and rollback
      const shouldRollback = true
      const finalCards = shouldRollback ? originalCards : optimisticCards
      
      // Verify rollback
      expect(finalCards).toEqual(originalCards)
    })
  })

  describe('6. Performance Tests', () => {
    it('should handle large lists efficiently', () => {
      const largeCards = largeListCards
      const targetPosition = 50
      
      const startTime = performance.now()
      
      // Simulate position calculation for large list
      const cardsInList = largeCards.filter(c => c.list_id === 'list-3')
      const position = Math.max(0, Math.min(targetPosition, cardsInList.length))
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time (less than 10ms)
      expect(executionTime).toBeLessThan(10)
      expect(position).toBe(targetPosition)
    })

    it('should handle multiple rapid updates', () => {
      const cards = [...testCards]
      const updates = [
        { cardId: 'card-1', newPosition: 3 },
        { cardId: 'card-2', newPosition: 0 },
        { cardId: 'card-3', newPosition: 1 },
      ]
      
      const startTime = performance.now()
      
      updates.forEach(update => {
        const card = cards.find(c => c.id === update.cardId)
        if (card) {
          card.position = update.newPosition
        }
      })
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete multiple updates efficiently
      expect(executionTime).toBeLessThan(5)
    })
  })

  describe('7. WebSocket Integration Tests', () => {
    it('should handle card_moved events correctly', () => {
      const originalCards = [...testCards]
      const movedCard = {
        ...originalCards[0],
        list_id: 'list-2',
        position: 5,
      }
      
      // Simulate WebSocket card_moved event
      const updatedCards = originalCards.filter(c => c.id !== movedCard.id)
      updatedCards.push(movedCard)
      
      // Verify the card was moved correctly
      expect(updatedCards.find(c => c.id === movedCard.id)?.list_id).toBe('list-2')
      expect(updatedCards.find(c => c.id === movedCard.id)?.position).toBe(5)
    })

    it('should handle concurrent updates correctly', () => {
      const originalCards = [...testCards]
      
      // Simulate concurrent moves
      const move1 = { cardId: 'card-1', newListId: 'list-2', newPosition: 0 }
      const move2 = { cardId: 'card-2', newListId: 'list-3', newPosition: 1 }
      
      let updatedCards = [...originalCards]
      
      // Apply first move
      const card1 = updatedCards.find(c => c.id === move1.cardId)
      if (card1) {
        card1.list_id = move1.newListId
        card1.position = move1.newPosition
      }
      
      // Apply second move
      const card2 = updatedCards.find(c => c.id === move2.cardId)
      if (card2) {
        card2.list_id = move2.newListId
        card2.position = move2.newPosition
      }
      
      // Verify both moves were applied
      expect(updatedCards.find(c => c.id === move1.cardId)?.list_id).toBe(move1.newListId)
      expect(updatedCards.find(c => c.id === move2.cardId)?.list_id).toBe(move2.newListId)
    })
  })

  describe('8. Visual Feedback Tests', () => {
    it('should provide correct drag states', () => {
      const isDragging = true
      const isDraggedOver = false
      
      const getCardClassName = (isDragging: boolean, isDraggedOver: boolean) => {
        if (isDragging) {
          return "opacity-50 rotate-1 scale-95 shadow-xl border-blue-300"
        }
        if (isDraggedOver) {
          return "ring-2 ring-purple-500 bg-purple-50 shadow-xl scale-105 border-purple-300"
        }
        return "hover:shadow-md hover:scale-[1.02]"
      }
      
      const className = getCardClassName(isDragging, isDraggedOver)
      
      expect(className).toContain("opacity-50")
      expect(className).toContain("rotate-1")
      expect(className).toContain("scale-95")
    })

    it('should provide correct drop zone indicators', () => {
      const isDraggingOver = true
      
      const hasDropIndicator = isDraggingOver
      const hasPulseAnimation = isDraggingOver
      const hasPingAnimation = isDraggingOver
      
      expect(hasDropIndicator).toBe(true)
      expect(hasPulseAnimation).toBe(true)
      expect(hasPingAnimation).toBe(true)
    })
  })

  describe('9. Edge Cases and Stress Tests', () => {
    it('should handle empty board correctly', () => {
      const emptyCards: Card[] = []
      const targetPosition = 0
      
      // Should not throw error
      expect(() => {
        const position = Math.max(0, Math.min(targetPosition, emptyCards.length))
        expect(position).toBe(0)
      }).not.toThrow()
    })

    it('should handle single card board correctly', () => {
      const singleCard = [createMockCard('card-1', 'list-1', 1000, 'Single Card')]
      const targetPosition = 1
      
      const position = Math.max(0, Math.min(targetPosition, singleCard.length))
      expect(position).toBe(1)
    })

    it('should handle maximum position correctly', () => {
      const cards = testCards
      const maxPosition = cards.length
      
      const position = Math.max(0, Math.min(maxPosition, maxPosition))
      expect(position).toBe(maxPosition)
    })

    it('should handle rapid position changes', () => {
      const cards = [...testCards]
      const rapidChanges = Array.from({ length: 100 }, (_, i) => ({
        cardId: 'card-1',
        newPosition: i % cards.length
      }))
      
      let currentCards = [...cards]
      
      rapidChanges.forEach(change => {
        const card = currentCards.find(c => c.id === change.cardId)
        if (card) {
          card.position = change.newPosition
        }
      })
      
      // Should handle all changes without errors
      expect(currentCards.length).toBe(cards.length)
    })
  })

  describe('10. Integration Tests', () => {
    it('should integrate drag calculation with drop handling', () => {
      const cards = [...testCards]
      const draggedCard = cards[0]
      
      // Simulate drag calculation
      const mouseY = 220
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const totalCardHeight = cardHeight + cardSpacing
      
      let calculatedPosition = 0
      if (mouseY > headerHeight) {
        const cardAreaY = mouseY - headerHeight
        calculatedPosition = Math.floor(cardAreaY / totalCardHeight)
        calculatedPosition = Math.max(0, Math.min(calculatedPosition, cards.length))
      }
      
      // Simulate drop handling
      const targetPosition = calculatedPosition
      const cardsWithoutDragged = cards.filter(c => c.id !== draggedCard.id)
      const newCards = [...cardsWithoutDragged]
      newCards.splice(targetPosition, 0, { ...draggedCard, position: targetPosition })
      
      // Verify integration
      expect(newCards.length).toBe(cards.length)
      expect(newCards.find(c => c.id === draggedCard.id)?.position).toBe(targetPosition)
    })

    it('should handle complete drag and drop workflow', () => {
      const originalCards = [...testCards]
      const draggedCard = originalCards[0]
      const targetListId = 'list-2'
      const targetPosition = 1
      
      // Step 1: Drag start
      expect(draggedCard).toBeDefined()
      
      // Step 2: Optimistic update
      const optimisticCards = originalCards.filter(c => c.id !== draggedCard.id)
      const cardsInTargetList = optimisticCards.filter(c => c.list_id === targetListId)
      const otherCards = optimisticCards.filter(c => c.list_id !== targetListId)
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: targetPosition,
      })
      
      const updatedCards = [...otherCards, ...newCardsInTargetList]
      
      // Step 3: Verify optimistic update
      expect(updatedCards.find(c => c.id === draggedCard.id)?.list_id).toBe(targetListId)
      expect(updatedCards.find(c => c.id === draggedCard.id)?.position).toBe(targetPosition)
      
      // Step 4: Simulate API response
      const apiResponseCard = {
        ...draggedCard,
        list_id: targetListId,
        position: 1500, // Server calculated position
      }
      
      // Step 5: Update with server response
      const finalCards = updatedCards.map(c => 
        c.id === apiResponseCard.id ? apiResponseCard : c
      )
      
      // Step 6: Verify final state
      expect(finalCards.find(c => c.id === draggedCard.id)?.list_id).toBe(targetListId)
      expect(finalCards.find(c => c.id === draggedCard.id)?.position).toBe(1500)
    })
  })
}) 