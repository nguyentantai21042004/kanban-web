import { describe, it, expect } from 'vitest'
import type { Card } from '@/lib/types'

// Utility functions for position calculation
export const calculatePositionFromMouseY = (
  mouseY: number,
  headerHeight: number,
  cardHeight: number,
  cardSpacing: number,
  cardsLength: number
): number => {
  let position = 0
  if (mouseY > headerHeight) {
    const cardAreaY = mouseY - headerHeight
    const totalCardHeight = cardHeight + cardSpacing
    position = Math.floor(cardAreaY / totalCardHeight)
    position = Math.max(0, Math.min(position, cardsLength))
  }
  return position
}

export const validatePosition = (position: number, maxPosition: number): number => {
  return Math.max(0, Math.min(position, maxPosition))
}

export const sortCardsByPosition = (cards: Card[]): Card[] => {
  return [...cards].sort((a, b) => a.position - b.position)
}

export const insertCardAtPosition = (
  cards: Card[],
  card: Card,
  position: number
): Card[] => {
  const newCards = [...cards]
  // Validate position bounds
  const validPosition = Math.max(0, Math.min(position, newCards.length))
  newCards.splice(validPosition, 0, {
    ...card,
    position: validPosition, // Set the card's position to the valid position
  })
  
  // Update positions for cards after the inserted position
  for (let i = validPosition + 1; i < newCards.length; i++) {
    newCards[i] = {
      ...newCards[i],
      position: i,
    }
  }
  
  return newCards
}

export const moveCardBetweenLists = (
  allCards: Card[],
  cardId: string,
  targetListId: string,
  targetPosition: number
): Card[] => {
  const card = allCards.find(c => c.id === cardId)
  if (!card) return allCards
  
  // Remove card from current position
  const cardsWithoutCard = allCards.filter(c => c.id !== cardId)
  
  // Get cards in target list
  const cardsInTargetList = cardsWithoutCard.filter(c => c.list_id === targetListId)
  const otherCards = cardsWithoutCard.filter(c => c.list_id !== targetListId)
  
  // Validate target position
  const validPosition = Math.max(0, Math.min(targetPosition, cardsInTargetList.length))
  
  // Insert card at target position
  const newCardsInTargetList = insertCardAtPosition(cardsInTargetList, {
    ...card,
    list_id: targetListId,
    position: validPosition,
  }, validPosition)
  
  // Return all cards with the moved card in the target list
  return [...otherCards, ...newCardsInTargetList]
}

// Mock data
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

describe('Position Calculation Utilities', () => {
  describe('calculatePositionFromMouseY', () => {
    it('should calculate position correctly for different mouse Y values', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const cardsLength = 4
      
      const testCases = [
        { mouseY: 50, expected: 0 },   // In header
        { mouseY: 120, expected: 0 },  // First card
        { mouseY: 220, expected: 1 },  // Between card 1&2
        { mouseY: 320, expected: 2 },  // Between card 2&3
        { mouseY: 420, expected: 3 },  // End of list
      ]
      
      testCases.forEach(({ mouseY, expected }) => {
        const result = calculatePositionFromMouseY(mouseY, headerHeight, cardHeight, cardSpacing, cardsLength)
        expect(result).toBe(expected)
      })
    })
    
    it('should handle edge cases correctly', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      const cardsLength = 4
      
      const edgeCases = [
        { mouseY: -10, expected: 0 },      // Negative Y
        { mouseY: 0, expected: 0 },        // Zero Y
        { mouseY: 1000, expected: 4 },     // Very large Y
        { mouseY: 59, expected: 0 },       // Just before header
        { mouseY: 61, expected: 0 },       // Just after header
      ]
      
      edgeCases.forEach(({ mouseY, expected }) => {
        const result = calculatePositionFromMouseY(mouseY, headerHeight, cardHeight, cardSpacing, cardsLength)
        expect(result).toBe(expected)
      })
    })
    
    it('should respect bounds for different list lengths', () => {
      const headerHeight = 60
      const cardHeight = 100
      const cardSpacing = 12
      
      // Test with different list lengths
      const testCases = [
        { cardsLength: 0, mouseY: 200, expected: 0 },
        { cardsLength: 1, mouseY: 200, expected: 1 },
        { cardsLength: 5, mouseY: 1000, expected: 5 },
        { cardsLength: 10, mouseY: 2000, expected: 10 },
      ]
      
      testCases.forEach(({ cardsLength, mouseY, expected }) => {
        const result = calculatePositionFromMouseY(mouseY, headerHeight, cardHeight, cardSpacing, cardsLength)
        expect(result).toBe(expected)
      })
    })
  })
  
  describe('validatePosition', () => {
    it('should validate position bounds correctly', () => {
      const maxPosition = 4
      
      const testCases = [
        { position: -5, expected: 0 },
        { position: -1, expected: 0 },
        { position: 0, expected: 0 },
        { position: 2, expected: 2 },
        { position: 4, expected: 4 },
        { position: 5, expected: 4 },
        { position: 10, expected: 4 },
      ]
      
      testCases.forEach(({ position, expected }) => {
        const result = validatePosition(position, maxPosition)
        expect(result).toBe(expected)
      })
    })
    
    it('should handle edge cases', () => {
      // Empty list
      expect(validatePosition(0, 0)).toBe(0)
      expect(validatePosition(5, 0)).toBe(0)
      
      // Single item list
      expect(validatePosition(0, 1)).toBe(0)
      expect(validatePosition(1, 1)).toBe(1)
      expect(validatePosition(5, 1)).toBe(1)
    })
  })
  
  describe('sortCardsByPosition', () => {
    it('should sort cards by position correctly', () => {
      const cards = [
        createMockCard('card-3', 'list-1', 3000, 'Card 3'),
        createMockCard('card-1', 'list-1', 1000, 'Card 1'),
        createMockCard('card-2', 'list-1', 2000, 'Card 2'),
      ]
      
      const sorted = sortCardsByPosition(cards)
      
      expect(sorted[0].id).toBe('card-1')
      expect(sorted[1].id).toBe('card-2')
      expect(sorted[2].id).toBe('card-3')
    })
    
    it('should handle empty array', () => {
      const cards: Card[] = []
      const sorted = sortCardsByPosition(cards)
      expect(sorted).toEqual([])
    })
    
    it('should handle single card', () => {
      const cards = [createMockCard('card-1', 'list-1', 1000, 'Card 1')]
      const sorted = sortCardsByPosition(cards)
      expect(sorted).toEqual(cards)
    })
    
    it('should handle cards with same position', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 1000, 'Card 1'),
        createMockCard('card-2', 'list-1', 1000, 'Card 2'),
      ]
      
      const sorted = sortCardsByPosition(cards)
      // Should maintain original order for same positions
      expect(sorted.length).toBe(2)
    })
  })
  
  describe('insertCardAtPosition', () => {
    it('should insert card at specified position', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
        createMockCard('card-3', 'list-1', 2, 'Card 3'),
      ]
      
      const newCard = createMockCard('new-card', 'list-1', 1, 'New Card')
      const result = insertCardAtPosition(cards, newCard, 1)
      
      expect(result.length).toBe(4)
      expect(result[1].id).toBe('new-card')
      expect(result[1].position).toBe(1)
    })
    
    it('should update positions for cards after insertion', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
        createMockCard('card-3', 'list-1', 2, 'Card 3'),
      ]
      
      const newCard = createMockCard('new-card', 'list-1', 1, 'New Card')
      const result = insertCardAtPosition(cards, newCard, 1)
      
      // Check that positions are updated correctly
      expect(result[0].position).toBe(0)  // First card unchanged
      expect(result[1].position).toBe(1)  // New card
      expect(result[2].position).toBe(2)  // Second card moved
      expect(result[3].position).toBe(3)  // Third card moved
    })
    
    it('should handle insertion at beginning', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
      ]
      
      const newCard = createMockCard('new-card', 'list-1', 0, 'New Card')
      const result = insertCardAtPosition(cards, newCard, 0)
      
      expect(result[0].id).toBe('new-card')
      expect(result[0].position).toBe(0)
      expect(result[1].position).toBe(1)
      expect(result[2].position).toBe(2)
    })
    
    it('should handle insertion at end', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
      ]
      
      const newCard = createMockCard('new-card', 'list-1', 2, 'New Card')
      const result = insertCardAtPosition(cards, newCard, 2)
      
      expect(result[2].id).toBe('new-card')
      expect(result[2].position).toBe(2)
    })
    
    it('should handle empty array', () => {
      const cards: Card[] = []
      const newCard = createMockCard('new-card', 'list-1', 0, 'New Card')
      const result = insertCardAtPosition(cards, newCard, 0)
      
      expect(result.length).toBe(1)
      expect(result[0].id).toBe('new-card')
      expect(result[0].position).toBe(0)
    })
  })
  
  describe('moveCardBetweenLists', () => {
    it('should move card between lists correctly', () => {
      const allCards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
        createMockCard('card-3', 'list-2', 0, 'Card 3'),
      ]
      
      const result = moveCardBetweenLists(allCards, 'card-1', 'list-2', 1)
      
      // Check that card was moved
      const movedCard = result.find(c => c.id === 'card-1')
      expect(movedCard?.list_id).toBe('list-2')
      expect(movedCard?.position).toBe(1)
      
      // Check that other cards in list-1 are unchanged
      const card2 = result.find(c => c.id === 'card-2')
      expect(card2?.list_id).toBe('list-1')
      expect(card2?.position).toBe(1) // Should remain at position 1 in list-1
      
      // Check that card in list-2 is unchanged
      const card3 = result.find(c => c.id === 'card-3')
      expect(card3?.list_id).toBe('list-2')
      expect(card3?.position).toBe(0) // Should remain at position 0 in list-2
    })
    
    it('should handle non-existent card', () => {
      const allCards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
      ]
      
      const result = moveCardBetweenLists(allCards, 'non-existent', 'list-2', 0)
      expect(result).toEqual(allCards)
    })
    
    it('should handle same list move', () => {
      const allCards = [
        createMockCard('card-1', 'list-1', 0, 'Card 1'),
        createMockCard('card-2', 'list-1', 1, 'Card 2'),
      ]
      
      const result = moveCardBetweenLists(allCards, 'card-1', 'list-1', 1)
      
      const movedCard = result.find(c => c.id === 'card-1')
      expect(movedCard?.list_id).toBe('list-1')
      expect(movedCard?.position).toBe(1)
    })
  })
  
  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', () => {
      const largeCards = Array.from({ length: 1000 }, (_, i) =>
        createMockCard(`card-${i}`, 'list-1', i * 1000, `Card ${i}`)
      )
      
      const startTime = performance.now()
      const sorted = sortCardsByPosition(largeCards)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(10) // Should complete within 10ms
      expect(sorted.length).toBe(1000)
    })
    
    it('should handle multiple insertions efficiently', () => {
      const cards = Array.from({ length: 100 }, (_, i) =>
        createMockCard(`card-${i}`, 'list-1', i, `Card ${i}`)
      )
      
      const startTime = performance.now()
      
      for (let i = 0; i < 10; i++) {
        const newCard = createMockCard(`new-card-${i}`, 'list-1', i, `New Card ${i}`)
        insertCardAtPosition(cards, newCard, i)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50) // Should complete within 50ms
    })
  })
  
  describe('Edge Cases', () => {
    it('should handle negative positions gracefully', () => {
      const cards = [createMockCard('card-1', 'list-1', 0, 'Card 1')]
      const newCard = createMockCard('new-card', 'list-1', -1, 'New Card')
      
      const result = insertCardAtPosition(cards, newCard, -1)
      expect(result[0].position).toBe(0) // Should be corrected to 0
      expect(result[1].position).toBe(1) // Original card moved to position 1
    })

    it('should handle very large positions gracefully', () => {
      const cards = [createMockCard('card-1', 'list-1', 0, 'Card 1')]
      const newCard = createMockCard('new-card', 'list-1', 999, 'New Card')
      
      const result = insertCardAtPosition(cards, newCard, 999)
      expect(result[0].position).toBe(0) // Original card stays at position 0
      expect(result[1].position).toBe(1) // New card placed at position 1 (end of array)
    })
    
    it('should handle floating point positions', () => {
      const cards = [
        createMockCard('card-1', 'list-1', 0.5, 'Card 1'),
        createMockCard('card-2', 'list-1', 1.7, 'Card 2'),
      ]
      
      const sorted = sortCardsByPosition(cards)
      expect(sorted[0].position).toBe(0.5)
      expect(sorted[1].position).toBe(1.7)
    })
  })
}) 