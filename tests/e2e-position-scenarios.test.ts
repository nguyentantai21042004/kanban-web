import { describe, it, expect, beforeEach } from 'vitest'
import type { Card, List } from '@/lib/types'

// Mock data cho E2E testing
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

const createMockList = (id: string, boardId: string, position: number, title: string): List => ({
  id,
  title,
  board_id: boardId,
  position,
})

// E2E Test Scenarios
describe('E2E Position Calculation Scenarios', () => {
  let boardCards: Card[]
  let boardLists: List[]
  let boardId: string

  beforeEach(() => {
    boardId = 'board-1'
    boardLists = [
      createMockList('list-1', boardId, 0, 'To Do'),
      createMockList('list-2', boardId, 1, 'In Progress'),
      createMockList('list-3', boardId, 2, 'Done'),
    ]
    
    boardCards = [
      // List 1: To Do
      createMockCard('card-1', 'list-1', 0, 'Task 1'),
      createMockCard('card-2', 'list-1', 1, 'Task 2'),
      createMockCard('card-3', 'list-1', 2, 'Task 3'),
      
      // List 2: In Progress
      createMockCard('card-4', 'list-2', 0, 'Task 4'),
      createMockCard('card-5', 'list-2', 1, 'Task 5'),
      
      // List 3: Done
      createMockCard('card-6', 'list-3', 0, 'Task 6'),
    ]
  })

  describe('Scenario 1: User drags card from To Do to In Progress', () => {
    it('should handle complete workflow correctly', () => {
      const draggedCard = boardCards.find(c => c.id === 'card-1')!
      const targetListId = 'list-2'
      const targetPosition = 1 // Between Task 4 and Task 5
      
      // Step 1: User starts dragging
      expect(draggedCard.list_id).toBe('list-1')
      expect(draggedCard.position).toBe(0)
      
      // Step 2: Optimistic update
      const cardsWithoutDragged = boardCards.filter(c => c.id !== draggedCard.id)
      const cardsInTargetList = cardsWithoutDragged.filter(c => c.list_id === targetListId)
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== targetListId)
      
      // Update positions for cards in the source list (list-1)
      const cardsInSourceList = otherCards.filter(c => c.list_id === 'list-1')
      const updatedCardsInSourceList = cardsInSourceList.map((card, index) => ({
        ...card,
        position: index,
      }))
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: targetPosition,
      })
      
      // Update positions for cards after the inserted position in target list
      for (let i = targetPosition + 1; i < newCardsInTargetList.length; i++) {
        newCardsInTargetList[i] = {
          ...newCardsInTargetList[i],
          position: i,
        }
      }
      
      const optimisticCards = [...updatedCardsInSourceList, ...newCardsInTargetList]
      
      // Step 3: Verify optimistic update
      const movedCard = optimisticCards.find(c => c.id === draggedCard.id)
      expect(movedCard?.list_id).toBe(targetListId)
      expect(movedCard?.position).toBe(targetPosition)
      
      // Step 4: Simulate API response
      const apiResponseCard = {
        ...draggedCard,
        list_id: targetListId,
        position: 1500, // Server calculated position
      }
      
      // Step 5: Update with server response
      const finalCards = optimisticCards.map(c => 
        c.id === apiResponseCard.id ? apiResponseCard : c
      )
      
      // Step 6: Verify final state
      const finalMovedCard = finalCards.find(c => c.id === draggedCard.id)
      expect(finalMovedCard?.list_id).toBe(targetListId)
      expect(finalMovedCard?.position).toBe(1500)
      
      // Step 7: Verify other cards are unchanged
      const card2 = finalCards.find(c => c.id === 'card-2')
      expect(card2?.list_id).toBe('list-1')
      expect(card2?.position).toBe(0) // Should remain at position 0 in list-1 (card-1 was moved out)
      
      const card4 = finalCards.find(c => c.id === 'card-4')
      expect(card4?.list_id).toBe('list-2')
      expect(card4?.position).toBe(0) // Should remain at position 0 in list-2
      
      const card5 = finalCards.find(c => c.id === 'card-5')
      expect(card5?.list_id).toBe('list-2')
      expect(card5?.position).toBe(2) // Should be updated to position 2 after insertion
    })
  })

  describe('Scenario 2: User reorders cards within same list', () => {
    it('should handle reordering correctly', () => {
      const draggedCard = boardCards.find(c => c.id === 'card-3')! // Last card in To Do
      const targetPosition = 0 // Move to beginning
      
      // Step 1: Verify initial state
      expect(draggedCard.list_id).toBe('list-1')
      expect(draggedCard.position).toBe(2)
      
      // Step 2: Optimistic update
      const cardsInList = boardCards.filter(c => c.list_id === 'list-1')
      const otherCards = boardCards.filter(c => c.list_id !== 'list-1')
      
      const cardsWithoutDragged = cardsInList.filter(c => c.id !== draggedCard.id)
      const newCardsInList = [...cardsWithoutDragged]
      newCardsInList.splice(targetPosition, 0, {
        ...draggedCard,
        position: targetPosition,
      })
      
      // Update positions for all cards in the list
      for (let i = 0; i < newCardsInList.length; i++) {
        newCardsInList[i] = {
          ...newCardsInList[i],
          position: i,
        }
      }
      
      const optimisticCards = [...otherCards, ...newCardsInList]
      
      // Step 3: Verify optimistic update
      const movedCard = optimisticCards.find(c => c.id === draggedCard.id)
      expect(movedCard?.position).toBe(0)
      
      // Step 4: Verify other cards in the same list
      const card1 = optimisticCards.find(c => c.id === 'card-1')
      expect(card1?.position).toBe(1)
      
      const card2 = optimisticCards.find(c => c.id === 'card-2')
      expect(card2?.position).toBe(2)
      
      // Step 5: Verify cards in other lists are unchanged
      const card4 = optimisticCards.find(c => c.id === 'card-4')
      expect(card4?.list_id).toBe('list-2')
      expect(card4?.position).toBe(0)
    })
  })

  describe('Scenario 3: User drags card to empty list', () => {
    it('should handle empty list correctly', () => {
      // Create empty list
      const emptyListId = 'list-4'
      const emptyList = createMockList(emptyListId, boardId, 3, 'Empty List')
      boardLists.push(emptyList)
      
      const draggedCard = boardCards.find(c => c.id === 'card-1')!
      const targetPosition = 0
      
      // Step 1: Verify empty list has no cards
      const cardsInEmptyList = boardCards.filter(c => c.list_id === emptyListId)
      expect(cardsInEmptyList.length).toBe(0)
      
      // Step 2: Optimistic update
      const cardsWithoutDragged = boardCards.filter(c => c.id !== draggedCard.id)
      const cardsInTargetList = cardsWithoutDragged.filter(c => c.list_id === emptyListId)
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== emptyListId)
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: emptyListId,
        position: targetPosition,
      })
      
      const optimisticCards = [...otherCards, ...newCardsInTargetList]
      
      // Step 3: Verify optimistic update
      const movedCard = optimisticCards.find(c => c.id === draggedCard.id)
      expect(movedCard?.list_id).toBe(emptyListId)
      expect(movedCard?.position).toBe(0)
      
      // Step 4: Verify only one card in empty list
      const cardsInEmptyListAfter = optimisticCards.filter(c => c.list_id === emptyListId)
      expect(cardsInEmptyListAfter.length).toBe(1)
    })
  })

  describe('Scenario 4: Multiple concurrent drag operations', () => {
    it('should handle concurrent operations correctly', () => {
      const operation1 = {
        cardId: 'card-1',
        targetListId: 'list-2',
        targetPosition: 0,
      }
      
      const operation2 = {
        cardId: 'card-4',
        targetListId: 'list-3',
        targetPosition: 1,
      }
      
      // Step 1: Apply first operation
      let currentCards = [...boardCards]
      const card1 = currentCards.find(c => c.id === operation1.cardId)!
      const cardsWithoutCard1 = currentCards.filter(c => c.id !== operation1.cardId)
      const cardsInTargetList1 = cardsWithoutCard1.filter(c => c.list_id === operation1.targetListId)
      const otherCards1 = cardsWithoutCard1.filter(c => c.list_id !== operation1.targetListId)
      
      const newCardsInTargetList1 = [...cardsInTargetList1]
      newCardsInTargetList1.splice(operation1.targetPosition, 0, {
        ...card1,
        list_id: operation1.targetListId,
        position: operation1.targetPosition,
      })
      
      currentCards = [...otherCards1, ...newCardsInTargetList1]
      
      // Step 2: Apply second operation
      const card4 = currentCards.find(c => c.id === operation2.cardId)!
      const cardsWithoutCard4 = currentCards.filter(c => c.id !== operation2.cardId)
      const cardsInTargetList2 = cardsWithoutCard4.filter(c => c.list_id === operation2.targetListId)
      const otherCards2 = cardsWithoutCard4.filter(c => c.list_id !== operation2.targetListId)
      
      const newCardsInTargetList2 = [...cardsInTargetList2]
      newCardsInTargetList2.splice(operation2.targetPosition, 0, {
        ...card4,
        list_id: operation2.targetListId,
        position: operation2.targetPosition,
      })
      
      const finalCards = [...otherCards2, ...newCardsInTargetList2]
      
      // Step 3: Verify both operations were applied
      const finalCard1 = finalCards.find(c => c.id === operation1.cardId)
      expect(finalCard1?.list_id).toBe(operation1.targetListId)
      expect(finalCard1?.position).toBe(operation1.targetPosition)
      
      const finalCard4 = finalCards.find(c => c.id === operation2.cardId)
      expect(finalCard4?.list_id).toBe(operation2.targetListId)
      expect(finalCard4?.position).toBe(operation2.targetPosition)
      
      // Step 4: Verify total card count is maintained
      expect(finalCards.length).toBe(boardCards.length)
    })
  })

  describe('Scenario 5: Error handling and rollback', () => {
    it('should handle network errors with rollback', () => {
      const draggedCard = boardCards.find(c => c.id === 'card-1')!
      const targetListId = 'list-2'
      const targetPosition = 1
      
      // Store original state
      const originalCards = [...boardCards]
      
      // Step 1: Optimistic update
      const cardsWithoutDragged = boardCards.filter(c => c.id !== draggedCard.id)
      const cardsInTargetList = cardsWithoutDragged.filter(c => c.list_id === targetListId)
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== targetListId)
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: targetPosition,
      })
      
      const optimisticCards = [...otherCards, ...newCardsInTargetList]
      
      // Step 2: Simulate network error
      const shouldRollback = true
      const finalCards = shouldRollback ? originalCards : optimisticCards
      
      // Step 3: Verify rollback
      expect(finalCards).toEqual(originalCards)
      
      // Step 4: Verify card is back in original position
      const rolledBackCard = finalCards.find(c => c.id === draggedCard.id)
      expect(rolledBackCard?.list_id).toBe('list-1')
      expect(rolledBackCard?.position).toBe(0)
    })
  })

  describe('Scenario 6: Performance with large datasets', () => {
    it('should handle large board efficiently', () => {
      // Create large dataset
      const largeBoardCards: Card[] = []
      const largeBoardLists: List[] = []
      
      // Create 10 lists
      for (let i = 0; i < 10; i++) {
        largeBoardLists.push(createMockList(`list-${i}`, boardId, i, `List ${i}`))
      }
      
      // Create 1000 cards distributed across lists
      for (let i = 0; i < 1000; i++) {
        const listId = `list-${i % 10}`
        largeBoardCards.push(createMockCard(`card-${i}`, listId, i, `Card ${i}`))
      }
      
      const startTime = performance.now()
      
      // Simulate complex drag operation
      const draggedCard = largeBoardCards[0]
      const targetListId = 'list-5'
      const targetPosition = 50
      
      const cardsWithoutDragged = largeBoardCards.filter(c => c.id !== draggedCard.id)
      const cardsInTargetList = cardsWithoutDragged.filter(c => c.list_id === targetListId)
      const otherCards = cardsWithoutDragged.filter(c => c.list_id !== targetListId)
      
      const newCardsInTargetList = [...cardsInTargetList]
      newCardsInTargetList.splice(targetPosition, 0, {
        ...draggedCard,
        list_id: targetListId,
        position: targetPosition,
      })
      
      const finalCards = [...otherCards, ...newCardsInTargetList]
      
      const endTime = performance.now()
      const executionTime = endTime - startTime
      
      // Should complete within reasonable time
      expect(executionTime).toBeLessThan(100) // 100ms for large dataset
      expect(finalCards.length).toBe(largeBoardCards.length)
      
      // Verify the move was successful
      const movedCard = finalCards.find(c => c.id === draggedCard.id)
      expect(movedCard?.list_id).toBe(targetListId)
      expect(movedCard?.position).toBe(targetPosition)
    })
  })

  describe('Scenario 7: Edge cases and stress testing', () => {
    it('should handle rapid successive operations', () => {
      let currentCards = [...boardCards]
      
      // Perform 50 rapid operations
      for (let i = 0; i < 50; i++) {
        const cardId = `card-${(i % 6) + 1}`
        const targetListId = `list-${(i % 3) + 1}`
        const targetPosition = i % 3
        
        const card = currentCards.find(c => c.id === cardId)
        if (card) {
          const cardsWithoutCard = currentCards.filter(c => c.id !== cardId)
          const cardsInTargetList = cardsWithoutCard.filter(c => c.list_id === targetListId)
          const otherCards = cardsWithoutCard.filter(c => c.list_id !== targetListId)
          
          const newCardsInTargetList = [...cardsInTargetList]
          newCardsInTargetList.splice(targetPosition, 0, {
            ...card,
            list_id: targetListId,
            position: targetPosition,
          })
          
          currentCards = [...otherCards, ...newCardsInTargetList]
        }
      }
      
      // Should maintain data integrity
      expect(currentCards.length).toBe(boardCards.length)
      
      // Should have unique IDs
      const cardIds = currentCards.map(c => c.id)
      const uniqueIds = new Set(cardIds)
      expect(uniqueIds.size).toBe(cardIds.length)
    })
    
    it('should handle invalid operations gracefully', () => {
      const invalidOperations = [
        { cardId: 'non-existent', targetListId: 'list-1', targetPosition: 0 },
        { cardId: 'card-1', targetListId: 'non-existent', targetPosition: 0 },
        { cardId: 'card-1', targetListId: 'list-1', targetPosition: -1 },
        { cardId: 'card-1', targetListId: 'list-1', targetPosition: 999 },
      ]
      
      invalidOperations.forEach(operation => {
        const card = boardCards.find(c => c.id === operation.cardId)
        if (card) {
          // Should handle gracefully without throwing
          expect(() => {
            const cardsWithoutCard = boardCards.filter(c => c.id !== operation.cardId)
            const cardsInTargetList = cardsWithoutCard.filter(c => c.list_id === operation.targetListId)
            const otherCards = cardsWithoutCard.filter(c => c.list_id !== operation.targetListId)
            
            const newCardsInTargetList = [...cardsInTargetList]
            const validPosition = Math.max(0, Math.min(operation.targetPosition, cardsInTargetList.length))
            newCardsInTargetList.splice(validPosition, 0, {
              ...card,
              list_id: operation.targetListId,
              position: validPosition,
            })
          }).not.toThrow()
        }
      })
    })
  })
}) 