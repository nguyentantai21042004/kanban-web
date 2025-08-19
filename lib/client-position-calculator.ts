/**
 * Client-side position calculator for drag & drop operations
 * Handles position calculation with optimistic updates
 */

import { PositionManager } from './position-manager';
import type { Card } from './types';

export interface DropCalculationResult {
  position: string;
  confidence: 'high' | 'medium' | 'low';
  needsServerValidation: boolean;
}

export class ClientPositionCalculator {
  /**
   * Calculate position for dropped card
   * @param cards All cards in the board
   * @param targetListId Target list ID
   * @param dropIndex Index where card should be dropped (0-based)
   * @param draggedCardId ID of the card being dragged (to exclude from calculations)
   * @returns Calculated position
   */
  calculateDropPosition(
    cards: Card[],
    targetListId: string,
    dropIndex: number,
    draggedCardId?: string
  ): DropCalculationResult {
    console.log(`🎯 Calculating drop position:`, {
      targetListId,
      dropIndex,
      draggedCardId,
      totalCards: cards.length
    });

    // Filter and sort cards in target list (excluding dragged card)
    const listCards = cards
      .filter(card => {
        // Support both card.list.id and card.list_id formats
        const cardListId = card.list?.id || card.list_id;
        return cardListId === targetListId && 
               card.id !== draggedCardId &&
               PositionManager.isValidPosition(String(card.position));
      })
      .sort((a, b) => PositionManager.comparePositions(String(a.position), String(b.position)));

    console.log(`📋 List cards:`, listCards.map(c => ({ id: c.id, name: c.name, position: c.position, positionStr: String(c.position) })));

    // Handle edge cases
    if (listCards.length === 0) {
      console.log(`📍 Empty list - using default position`);
      return {
        position: PositionManager.generatePosition(),
        confidence: 'high',
        needsServerValidation: false
      };
    }

    // Clamp drop index to valid range
    const clampedIndex = Math.max(0, Math.min(dropIndex, listCards.length));
    
    if (clampedIndex !== dropIndex) {
      console.log(`⚠️ Drop index clamped from ${dropIndex} to ${clampedIndex}`);
    }

    let position: string;
    let confidence: 'high' | 'medium' | 'low' = 'high';
    
    if (clampedIndex === 0) {
      // Drop at beginning
      position = PositionManager.generatePosition(undefined, String(listCards[0].position));
      console.log(`📍 Drop at beginning: "${position}"`);
    } else if (clampedIndex >= listCards.length) {
      // Drop at end
      position = PositionManager.generatePosition(String(listCards[listCards.length - 1].position));
      console.log(`📍 Drop at end: "${position}"`);
    } else {
      // Drop between two cards
      const beforeCard = listCards[clampedIndex - 1];
      const afterCard = listCards[clampedIndex];
      
      // Check if positions are too close (for numeric positions)
      const positionDiff = this.calculatePositionDifference(String(beforeCard.position), String(afterCard.position));
      if (positionDiff < 0.001) {
        console.log(`⚠️ Positions too close, may need server rebalancing`);
        confidence = 'low';
      }
      
      position = PositionManager.generatePosition(String(beforeCard.position), String(afterCard.position));
      console.log(`📍 Drop between cards: "${position}" (between "${beforeCard.position}" and "${afterCard.position}")`);
    }

    // Check if generated position is getting too long
    const needsServerValidation = position.length > 8 || confidence === 'low';
    
    if (needsServerValidation) {
      console.log(`🔄 Position may need server validation (length: ${position.length}, confidence: ${confidence})`);
    }

    return {
      position,
      confidence,
      needsServerValidation
    };
  }

  /**
   * Calculate visual drop position for UI feedback
   * This is used for immediate visual feedback during drag
   */
  calculateVisualDropIndex(
    mouseY: number,
    listElement: HTMLElement,
    cardElements: HTMLElement[]
  ): number {
    if (cardElements.length === 0) {
      return 0;
    }

    const listRect = listElement.getBoundingClientRect();
    const relativeY = mouseY - listRect.top;

    // Find the card that the mouse is closest to
    let closestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < cardElements.length; i++) {
      const cardRect = cardElements[i].getBoundingClientRect();
      const cardCenterY = cardRect.top + cardRect.height / 2 - listRect.top;
      const distance = Math.abs(relativeY - cardCenterY);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    // Determine if we should insert before or after the closest card
    const closestCardRect = cardElements[closestIndex].getBoundingClientRect();
    const closestCardCenterY = closestCardRect.top + closestCardRect.height / 2 - listRect.top;

    if (relativeY < closestCardCenterY) {
      return closestIndex;
    } else {
      return closestIndex + 1;
    }
  }

  /**
   * Batch calculate positions for multiple cards
   */
  calculateBatchPositions(
    cards: Card[],
    moves: Array<{ cardId: string; targetListId: string; targetIndex: number }>
  ): Map<string, DropCalculationResult> {
    console.log(`🔄 Batch calculating positions for ${moves.length} moves`);
    
    const results = new Map<string, DropCalculationResult>();
    let workingCards = [...cards];

    // Sort moves by target index to process in order
    const sortedMoves = [...moves].sort((a, b) => a.targetIndex - b.targetIndex);

    for (const move of sortedMoves) {
      const result = this.calculateDropPosition(
        workingCards,
        move.targetListId,
        move.targetIndex,
        move.cardId
      );

      results.set(move.cardId, result);

      // Update working cards for next calculation
      workingCards = workingCards.map(card => {
        if (card.id === move.cardId) {
          return {
            ...card,
            list: { id: move.targetListId, name: '' },
            list_id: move.targetListId,
            position: Number(result.position) // Convert back to number for Card type
          };
        }
        return card;
      });
    }

    return results;
  }

  /**
   * Validate calculated position against current state
   */
  validatePosition(
    position: string,
    cards: Card[],
    targetListId: string,
    excludeCardId?: string
  ): boolean {
    const listCards = cards
      .filter(card => {
        const cardListId = card.list?.id || card.list_id;
        return cardListId === targetListId && 
               card.id !== excludeCardId;
      })
      .sort((a, b) => PositionManager.comparePositions(String(a.position), String(b.position)));

    // Find where this position would be inserted
    let insertIndex = 0;
    for (const card of listCards) {
      if (PositionManager.comparePositions(position, String(card.position)) > 0) {
        insertIndex++;
      } else {
        break;
      }
    }

    // Check if position maintains order
    const beforeCard = listCards[insertIndex - 1];
    const afterCard = listCards[insertIndex];

        if (beforeCard && PositionManager.comparePositions(String(beforeCard.position), position) >= 0) {
      return false;
    }
    
    if (afterCard && PositionManager.comparePositions(position, String(afterCard.position)) >= 0) {
      return false;
    }

    return true;
  }

  /**
   * Calculate approximate difference between two positions
   * Used for detecting when positions are too close
   */
  private calculatePositionDifference(pos1: string, pos2: string): number {
    // Simple heuristic based on string comparison
    const maxLength = Math.max(pos1.length, pos2.length);
    let diff = 0;
    
    for (let i = 0; i < maxLength; i++) {
      const char1 = i < pos1.length ? pos1[i] : '0';
      const char2 = i < pos2.length ? pos2[i] : '0';
      
      if (char1 !== char2) {
        const base62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
        const index1 = base62.indexOf(char1);
        const index2 = base62.indexOf(char2);
        diff = Math.abs(index2 - index1) / Math.pow(62, i);
        break;
      }
    }
    
    return diff;
  }

  /**
   * Detect if positions need rebalancing
   */
  needsRebalancing(cards: Card[], listId: string): boolean {
    const listCards = cards
      .filter(card => {
        const cardListId = card.list?.id || card.list_id;
        return cardListId === listId;
      })
      .sort((a, b) => PositionManager.comparePositions(String(a.position), String(b.position)));

    // Check for positions that are too long
    const hasLongPositions = listCards.some(card => String(card.position).length > 8);
    
    // Check for positions that are too close
    const hasTightPositions = listCards.some((card, index) => {
      if (index === 0) return false;
      const diff = this.calculatePositionDifference(
        String(listCards[index - 1].position),
        String(card.position)
      );
      return diff < 0.001;
    });

    return hasLongPositions || hasTightPositions;
  }
}