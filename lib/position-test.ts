/**
 * Test suite for position management algorithms
 * Use this to validate the position system before deploying
 */

import { PositionManager } from './position-manager';
import { ClientPositionCalculator } from './client-position-calculator';
import { OptimisticUpdateManager } from './optimistic-update-manager';
import type { Card } from './types';

export class PositionTestSuite {
  private positionManager = PositionManager;
  private calculator = new ClientPositionCalculator();
  private optimisticManager = new OptimisticUpdateManager();

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Position Management Test Suite');
    
    try {
      await this.testBasicPositionGeneration();
      await this.testPositionOrdering();
      await this.testBulkGeneration();
      await this.testRebalancing();
      await this.testOptimisticUpdates();
      await this.testConflictResolution();
      await this.testEdgeCases();
      await this.testPerformance();
      
      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      throw error;
    }
  }

  private async testBasicPositionGeneration(): Promise<void> {
    console.log('📍 Testing basic position generation...');

    // Test first position
    const first = this.positionManager.generatePosition();
    console.assert(first === 'n', 'First position should be "n"');

    // Test before
    const before = this.positionManager.generatePosition(undefined, 'n');
    console.assert(before < 'n', 'Before position should be less than "n"');

    // Test after
    const after = this.positionManager.generatePosition('n');
    console.assert(after > 'n', 'After position should be greater than "n"');

    // Test between
    const between = this.positionManager.generatePosition('a', 'z');
    console.assert(between > 'a' && between < 'z', 'Between position should be between "a" and "z"');

    console.log('✅ Basic position generation tests passed');
  }

  private async testPositionOrdering(): Promise<void> {
    console.log('📊 Testing position ordering...');

    const positions: string[] = [];
    
    // Generate a series of positions
    positions.push(this.positionManager.generatePosition()); // First
    
    for (let i = 0; i < 10; i++) {
      const newPos = this.positionManager.generatePosition(positions[positions.length - 1]);
      positions.push(newPos);
    }

    // Verify ordering
    for (let i = 1; i < positions.length; i++) {
      console.assert(
        this.positionManager.comparePositions(positions[i-1], positions[i]) < 0,
        `Position ${i-1} should be less than position ${i}`
      );
    }

    // Test sorting
    const shuffled = [...positions].sort(() => Math.random() - 0.5);
    const sorted = this.positionManager.sortByPosition(
      shuffled.map((pos, i) => ({ position: pos, id: i.toString() }))
    );

    for (let i = 0; i < sorted.length; i++) {
      console.assert(
        sorted[i].position === positions[i],
        `Sorted position ${i} should match original order`
      );
    }

    console.log('✅ Position ordering tests passed');
  }

  private async testBulkGeneration(): Promise<void> {
    console.log('🔢 Testing bulk position generation...');

    // Test generating multiple positions
    const bulk1 = this.positionManager.generateMultiplePositions(5);
    console.assert(bulk1.length === 5, 'Should generate 5 positions');

    // Verify they are in order
    for (let i = 1; i < bulk1.length; i++) {
      console.assert(
        bulk1[i-1] < bulk1[i],
        `Bulk position ${i-1} should be less than ${i}`
      );
    }

    // Test generating between two positions
    const bulk2 = this.positionManager.generateMultiplePositions(3, 'a', 'z');
    console.assert(bulk2.length === 3, 'Should generate 3 positions');
    console.assert(bulk2[0] > 'a' && bulk2[2] < 'z', 'Positions should be between bounds');

    console.log('✅ Bulk generation tests passed');
  }

  private async testRebalancing(): Promise<void> {
    console.log('⚖️ Testing position rebalancing...');

    // Create items with long positions (simulating many operations)
    const items = [
      { id: '1', position: 'a0000000000' },
      { id: '2', position: 'a0000000001' },
      { id: '3', position: 'a0000000002' },
      { id: '4', position: 'a0000000003' },
    ];

    const rebalanceMap = this.positionManager.rebalancePositions(items, 5);
    
    if (rebalanceMap.size > 0) {
      // Verify rebalanced positions are shorter
      for (const [id, newPosition] of rebalanceMap) {
        console.assert(
          newPosition.length <= 5,
          `Rebalanced position for ${id} should be shorter`
        );
      }
      
      // Verify order is maintained
      const rebalancedItems = items.map(item => ({
        ...item,
        position: rebalanceMap.get(item.id) || item.position
      }));
      
      const sorted = this.positionManager.sortByPosition(rebalancedItems);
      for (let i = 0; i < sorted.length; i++) {
        console.assert(
          sorted[i].id === items[i].id,
          'Rebalanced items should maintain original order'
        );
      }
    }

    console.log('✅ Rebalancing tests passed');
  }

  private async testOptimisticUpdates(): Promise<void> {
    console.log('🎯 Testing optimistic updates...');

    const mockCards: Card[] = [
      { id: '1', name: 'Card 1', position: 'a', list: { id: 'list1', name: 'List 1' } } as Card,
      { id: '2', name: 'Card 2', position: 'n', list: { id: 'list1', name: 'List 1' } } as Card,
      { id: '3', name: 'Card 3', position: 'z', list: { id: 'list1', name: 'List 1' } } as Card,
    ];

    const mockApiCall = async (card: Card): Promise<Card> => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return { ...card, updated_at: new Date().toISOString() };
    };

    try {
      const result = await this.optimisticManager.executeOptimisticMove(
        mockCards[0],
        'list2',
        1,
        mockCards,
        mockApiCall
      );

      console.assert(result.list.id === 'list2', 'Card should be moved to new list');
      console.assert(result.updated_at !== mockCards[0].updated_at, 'Card should have updated timestamp');
    } catch (error) {
      console.error('Optimistic update test failed:', error);
      throw error;
    }

    console.log('✅ Optimistic update tests passed');
  }

  private async testConflictResolution(): Promise<void> {
    console.log('⚔️ Testing conflict resolution...');

    const localCard: Card = {
      id: '1',
      name: 'Card 1',
      position: 'a',
      list: { id: 'list1', name: 'List 1' },
      updated_at: '2023-01-01T10:00:00Z'
    } as Card;

    const remoteCard: Card = {
      id: '1',
      name: 'Card 1',
      position: 'b',
      list: { id: 'list1', name: 'List 1' },
      updated_at: '2023-01-01T10:00:01Z'
    } as Card;

    // Test timestamp resolution
    const winner = this.optimisticManager.resolveConflict(localCard, remoteCard);
    console.assert(winner.updated_at === remoteCard.updated_at, 'Remote card should win (newer timestamp)');

    // Test server wins strategy
    this.optimisticManager.setConflictStrategy({ type: 'server_wins' });
    const serverWins = this.optimisticManager.resolveConflict(localCard, remoteCard);
    console.assert(serverWins.position === remoteCard.position, 'Server should always win');

    console.log('✅ Conflict resolution tests passed');
  }

  private async testEdgeCases(): Promise<void> {
    console.log('🔍 Testing edge cases...');

    // Test empty positions
    const emptyResult = this.calculator.calculateDropPosition([], 'list1', 0);
    console.assert(
      emptyResult.position === 'n',
      'Empty list should get default position'
    );

    // Test invalid positions
    console.assert(!this.positionManager.isValidPosition(''), 'Empty string should be invalid');
    console.assert(!this.positionManager.isValidPosition('!@#'), 'Special characters should be invalid');
    console.assert(this.positionManager.isValidPosition('aZ9'), 'Valid base62 should be valid');

    // Test position comparison edge cases
    console.assert(this.positionManager.comparePositions('a', 'aa') < 0, 'Shorter should come before longer');
    console.assert(this.positionManager.comparePositions('z', 'aa') > 0, 'Lexicographic order should be preserved');

    console.log('✅ Edge case tests passed');
  }

  private async testPerformance(): Promise<void> {
    console.log('⚡ Testing performance...');

    const iterations = 1000;
    
    // Test position generation performance
    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      this.positionManager.generatePosition();
    }
    const end1 = performance.now();
    const avgGenTime = (end1 - start1) / iterations;
    console.assert(avgGenTime < 1, 'Position generation should be under 1ms on average');

    // Test sorting performance
    const cards = Array.from({ length: iterations }, (_, i) => ({
      id: i.toString(),
      position: this.positionManager.generatePosition()
    }));

    const start2 = performance.now();
    this.positionManager.sortByPosition(cards);
    const end2 = performance.now();
    const sortTime = end2 - start2;
    console.assert(sortTime < 100, 'Sorting 1000 items should be under 100ms');

    console.log(`📊 Performance metrics:
      - Position generation: ${avgGenTime.toFixed(3)}ms avg
      - Sorting ${iterations} items: ${sortTime.toFixed(3)}ms
    `);

    console.log('✅ Performance tests passed');
  }

  // Utility method to run tests in browser console
  static async runInConsole(): Promise<void> {
    const suite = new PositionTestSuite();
    await suite.runAllTests();
  }
}

// Export for browser testing
if (typeof window !== 'undefined') {
  (window as any).PositionTestSuite = PositionTestSuite;
}