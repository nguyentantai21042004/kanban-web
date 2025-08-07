/**
 * Optimistic Update Manager with Conflict Resolution
 * Handles client-side optimistic updates with rollback capabilities
 */

import { ClientPositionCalculator, type DropCalculationResult } from './client-position-calculator';
import { PositionManager } from './position-manager';
import type { Card } from './types';

export interface OptimisticMove {
  id: string;
  cardId: string;
  originalCard: Card;
  optimisticCard: Card;
  timestamp: number;
  confidence: 'high' | 'medium' | 'low';
  retryCount: number;
  status: 'pending' | 'confirmed' | 'failed' | 'rolled_back';
}

export interface ConflictResolutionStrategy {
  type: 'timestamp' | 'user_priority' | 'server_wins' | 'client_wins';
  priority?: number;
}

export class OptimisticUpdateManager {
  private pendingMoves = new Map<string, OptimisticMove>();
  private positionCalculator = new ClientPositionCalculator();
  private conflictStrategy: ConflictResolutionStrategy = { type: 'timestamp' };
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  /**
   * Execute optimistic card move
   */
  async executeOptimisticMove(
    card: Card,
    targetListId: string,
    dropIndex: number,
    allCards: Card[],
    apiCall: (optimisticCard: Card) => Promise<Card>
  ): Promise<Card> {
    console.log(`🚀 Executing optimistic move:`, {
      cardId: card.id,
      from: card.list.id,
      to: targetListId,
      dropIndex
    });

    // Calculate optimistic position
    const positionResult = this.positionCalculator.calculateDropPosition(
      allCards,
      targetListId,
      dropIndex,
      card.id
    );

    // Create optimistic card
    const optimisticCard: Card = {
      ...card,
      list: { 
        id: targetListId, 
        name: allCards.find(c => c.list.id === targetListId)?.list.name || 'Unknown List'
      },
      position: positionResult.position,
      updated_at: new Date().toISOString(),
      updated_by: card.updated_by
    };

    // Create move record
    const moveId = this.generateMoveId();
    const optimisticMove: OptimisticMove = {
      id: moveId,
      cardId: card.id,
      originalCard: { ...card },
      optimisticCard: { ...optimisticCard },
      timestamp: Date.now(),
      confidence: positionResult.confidence,
      retryCount: 0,
      status: 'pending'
    };

    this.pendingMoves.set(card.id, optimisticMove);

    try {
      // Execute API call with retry logic
      const serverCard = await this.executeWithRetry(
        () => apiCall(optimisticCard),
        optimisticMove
      );

      // Success - confirm move
      optimisticMove.status = 'confirmed';
      this.pendingMoves.delete(card.id);

      console.log(`✅ Move confirmed:`, {
        cardId: card.id,
        serverPosition: serverCard.position,
        optimisticPosition: optimisticCard.position
      });

      return serverCard;

    } catch (error) {
      // Failure - mark for rollback
      optimisticMove.status = 'failed';
      console.error(`❌ Move failed:`, {
        cardId: card.id,
        error: error.message,
        retryCount: optimisticMove.retryCount
      });

      throw error;
    }
  }

  /**
   * Execute batch optimistic moves
   */
  async executeBatchOptimisticMoves(
    moves: Array<{
      card: Card;
      targetListId: string;
      dropIndex: number;
    }>,
    allCards: Card[],
    batchApiCall: (moves: OptimisticMove[]) => Promise<Card[]>
  ): Promise<Card[]> {
    console.log(`🔄 Executing batch optimistic moves: ${moves.length} cards`);

    // Calculate positions for all moves
    const positionResults = this.positionCalculator.calculateBatchPositions(
      allCards,
      moves.map(move => ({
        cardId: move.card.id,
        targetListId: move.targetListId,
        targetIndex: move.dropIndex
      }))
    );

    // Create optimistic moves
    const optimisticMoves: OptimisticMove[] = [];
    for (const move of moves) {
      const positionResult = positionResults.get(move.card.id)!;
      const optimisticCard: Card = {
        ...move.card,
        list: { id: move.targetListId, name: '' },
        position: positionResult.position,
        updated_at: new Date().toISOString()
      };

      const optimisticMove: OptimisticMove = {
        id: this.generateMoveId(),
        cardId: move.card.id,
        originalCard: { ...move.card },
        optimisticCard,
        timestamp: Date.now(),
        confidence: positionResult.confidence,
        retryCount: 0,
        status: 'pending'
      };

      optimisticMoves.push(optimisticMove);
      this.pendingMoves.set(move.card.id, optimisticMove);
    }

    try {
      const serverCards = await batchApiCall(optimisticMoves);
      
      // Confirm all moves
      optimisticMoves.forEach(move => {
        move.status = 'confirmed';
        this.pendingMoves.delete(move.cardId);
      });

      return serverCards;

    } catch (error) {
      // Mark all as failed
      optimisticMoves.forEach(move => {
        move.status = 'failed';
      });
      throw error;
    }
  }

  /**
   * Rollback failed optimistic updates
   */
  rollbackMove(cardId: string): Card | null {
    const move = this.pendingMoves.get(cardId);
    if (!move) {
      console.warn(`⚠️ No pending move found for card: ${cardId}`);
      return null;
    }

    console.log(`🔄 Rolling back move:`, {
      cardId,
      from: move.optimisticCard.list.id,
      to: move.originalCard.list.id
    });

    move.status = 'rolled_back';
    this.pendingMoves.delete(cardId);

    return move.originalCard;
  }

  /**
   * Rollback all pending moves
   */
  rollbackAllPendingMoves(): Map<string, Card> {
    console.log(`🔄 Rolling back all pending moves: ${this.pendingMoves.size} moves`);
    
    const rollbackCards = new Map<string, Card>();
    
    for (const [cardId, move] of this.pendingMoves) {
      if (move.status === 'pending' || move.status === 'failed') {
        rollbackCards.set(cardId, move.originalCard);
        move.status = 'rolled_back';
      }
    }

    this.pendingMoves.clear();
    return rollbackCards;
  }

  /**
   * Resolve conflicts between local and remote updates
   */
  resolveConflict(
    localCard: Card,
    remoteCard: Card,
    strategy?: ConflictResolutionStrategy
  ): Card {
    const resolveStrategy = strategy || this.conflictStrategy;
    
    console.log(`⚔️ Resolving conflict:`, {
      cardId: localCard.id,
      strategy: resolveStrategy.type,
      localUpdate: localCard.updated_at,
      remoteUpdate: remoteCard.updated_at
    });

    switch (resolveStrategy.type) {
      case 'timestamp':
        return this.resolveByTimestamp(localCard, remoteCard);
      
      case 'user_priority':
        return this.resolveByUserPriority(localCard, remoteCard, resolveStrategy.priority);
      
      case 'server_wins':
        console.log(`🏆 Server wins conflict resolution`);
        return remoteCard;
      
      case 'client_wins':
        console.log(`🏆 Client wins conflict resolution`);
        return localCard;
      
      default:
        return this.resolveByTimestamp(localCard, remoteCard);
    }
  }

  /**
   * Check if card has pending optimistic update
   */
  hasPendingMove(cardId: string): boolean {
    const move = this.pendingMoves.get(cardId);
    return move?.status === 'pending';
  }

  /**
   * Get pending move for card
   */
  getPendingMove(cardId: string): OptimisticMove | null {
    return this.pendingMoves.get(cardId) || null;
  }

  /**
   * Get all pending moves
   */
  getAllPendingMoves(): OptimisticMove[] {
    return Array.from(this.pendingMoves.values())
      .filter(move => move.status === 'pending');
  }

  /**
   * Clean up old moves
   */
  cleanup(maxAge: number = 30000): void {
    const now = Date.now();
    const expiredMoves: string[] = [];

    for (const [cardId, move] of this.pendingMoves) {
      if (now - move.timestamp > maxAge) {
        expiredMoves.push(cardId);
      }
    }

    expiredMoves.forEach(cardId => {
      console.log(`🧹 Cleaning up expired move: ${cardId}`);
      this.pendingMoves.delete(cardId);
    });
  }

  /**
   * Execute API call with retry logic
   */
  private async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    move: OptimisticMove
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retrying move (attempt ${attempt}/${this.maxRetries}):`, move.cardId);
          await this.delay(this.retryDelay * attempt);
        }

        const result = await apiCall();
        return result;

      } catch (error) {
        lastError = error as Error;
        move.retryCount = attempt + 1;

        if (attempt === this.maxRetries) {
          console.error(`❌ Max retries reached for move:`, move.cardId);
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          console.error(`❌ Non-retryable error for move:`, move.cardId);
          break;
        }
      }
    }

    throw lastError!;
  }

  /**
   * Resolve conflict by timestamp (last write wins)
   */
  private resolveByTimestamp(localCard: Card, remoteCard: Card): Card {
    const localTime = new Date(localCard.updated_at).getTime();
    const remoteTime = new Date(remoteCard.updated_at).getTime();

    if (localTime === remoteTime) {
      // Same timestamp, use ID as tiebreaker
      const winner = localCard.id.localeCompare(remoteCard.id) > 0 ? localCard : remoteCard;
      console.log(`🏆 Timestamp tie, winner by ID: ${winner.id}`);
      return winner;
    }

    const winner = localTime > remoteTime ? localCard : remoteCard;
    console.log(`🏆 Timestamp winner: ${winner.id} (${winner.updated_at})`);
    return winner;
  }

  /**
   * Resolve conflict by user priority
   */
  private resolveByUserPriority(
    localCard: Card,
    remoteCard: Card,
    userPriority?: number
  ): Card {
    // Fallback to timestamp if no priority logic
    return this.resolveByTimestamp(localCard, remoteCard);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const retryableErrors = [
      'NetworkError',
      'TimeoutError',
      'ConnectionError',
      'TemporaryFailure'
    ];

    return retryableErrors.some(type => 
      error.name.includes(type) || error.message.includes(type)
    );
  }

  /**
   * Generate unique move ID
   */
  private generateMoveId(): string {
    return `move_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility for retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set conflict resolution strategy
   */
  setConflictStrategy(strategy: ConflictResolutionStrategy): void {
    this.conflictStrategy = strategy;
    console.log(`🎯 Conflict strategy updated:`, strategy);
  }
}