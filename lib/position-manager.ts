/**
 * Advanced Position Manager using Fractional Indexing
 * Provides deterministic, conflict-free position generation for card ordering
 */

export class PositionManager {
  // Base-62 character set for position encoding
  private static readonly BASE_62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private static readonly MID_POINT = 'n'; // Middle character in base-62
  private static readonly MIN_CHAR = '0';
  private static readonly MAX_CHAR = 'z';

  /**
   * Generate position between two existing positions
   * @param before Position of the card before (optional)
   * @param after Position of the card after (optional)
   * @returns New position string
   */
  static generatePosition(before?: string, after?: string): string {
    console.log(`🎯 Generating position: before="${before}", after="${after}"`);
    
    if (!before && !after) {
      const result = this.MID_POINT;
      console.log(`📍 First item position: "${result}"`);
      return result;
    }
    
    if (!before) {
      const result = this.generateBefore(after!);
      console.log(`📍 Position before "${after}": "${result}"`);
      return result;
    }
    
    if (!after) {
      const result = this.generateAfter(before);
      console.log(`📍 Position after "${before}": "${result}"`);
      return result;
    }
    
    const result = this.generateBetween(before, after);
    console.log(`📍 Position between "${before}" and "${after}": "${result}"`);
    return result;
  }

  /**
   * Generate position before a given position
   */
  private static generateBefore(after: string): string {
    if (!after || after.length === 0) {
      return this.MIN_CHAR;
    }

    const firstChar = after[0];
    const index = this.BASE_62.indexOf(firstChar);
    
    if (index > 0) {
      // Can decrement first character
      return this.BASE_62[index - 1] + after.slice(1);
    }
    
    // First character is minimum, need to prepend
    return this.MIN_CHAR + this.generateBefore(after);
  }

  /**
   * Generate position after a given position
   */
  private static generateAfter(before: string): string {
    if (!before || before.length === 0) {
      return this.MID_POINT;
    }

    // Try to increment last character
    const lastChar = before[before.length - 1];
    const index = this.BASE_62.indexOf(lastChar);
    
    if (index < this.BASE_62.length - 1) {
      // Can increment last character
      return before.slice(0, -1) + this.BASE_62[index + 1];
    }
    
    // Last character is maximum, need to append
    return before + this.MID_POINT;
  }

  /**
   * Generate position between two positions
   */
  private static generateBetween(before: string, after: string): string {
    if (before >= after) {
      throw new Error(`Invalid position order: "${before}" >= "${after}"`);
    }

    // Find first differing position
    let i = 0;
    const minLength = Math.min(before.length, after.length);
    
    while (i < minLength && before[i] === after[i]) {
      i++;
    }

    const commonPrefix = before.slice(0, i);
    const beforeSuffix = before.slice(i) || this.MIN_CHAR;
    const afterSuffix = after.slice(i) || this.MAX_CHAR;

    const beforeChar = beforeSuffix[0];
    const afterChar = afterSuffix[0];
    
    const beforeIndex = this.BASE_62.indexOf(beforeChar);
    const afterIndex = this.BASE_62.indexOf(afterChar);
    
    if (afterIndex - beforeIndex > 1) {
      // Can insert character between
      const midIndex = Math.floor((beforeIndex + afterIndex) / 2);
      return commonPrefix + this.BASE_62[midIndex];
    }
    
    if (beforeSuffix.length > 1) {
      // Extend before suffix
      return commonPrefix + beforeChar + this.generateAfter(beforeSuffix.slice(1));
    }
    
    if (afterSuffix.length > 1) {
      // Use after suffix
      return commonPrefix + beforeChar + this.generateBefore(afterSuffix.slice(1));
    }
    
    // Both are single characters and adjacent, need to go deeper
    return commonPrefix + beforeChar + this.MID_POINT;
  }

  /**
   * Validate if a position string is valid
   * Supports both fractional strings and numeric strings (for backward compatibility)
   */
  static isValidPosition(position: string): boolean {
    if (!position || position.length === 0) {
      return false;
    }

    // If it's a numeric string (legacy format), it's valid
    if (/^\d+(\.\d+)?$/.test(position)) {
      return true;
    }

    // Check if all characters are in BASE_62 (new fractional format)
    for (const char of position) {
      if (this.BASE_62.indexOf(char) === -1) {
        return false;
      }
    }

    return true;
  }

  /**
   * Compare two positions (-1, 0, 1)
   * Supports both fractional strings and numeric strings
   */
  static comparePositions(a: string, b: string): number {
    // If both are numeric strings, compare as numbers
    const aIsNumeric = /^\d+(\.\d+)?$/.test(a);
    const bIsNumeric = /^\d+(\.\d+)?$/.test(b);
    
    if (aIsNumeric && bIsNumeric) {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      return numA - numB;
    }
    
    // If mixed or both fractional, use string comparison
    return a.localeCompare(b);
  }

  /**
   * Sort cards by position
   */
  static sortByPosition<T extends { position: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => this.comparePositions(a.position, b.position));
  }

  /**
   * Generate multiple positions for bulk operations
   */
  static generateMultiplePositions(count: number, before?: string, after?: string): string[] {
    if (count <= 0) return [];
    if (count === 1) return [this.generatePosition(before, after)];

    const positions: string[] = [];
    let currentBefore = before;
    
    for (let i = 0; i < count; i++) {
      const currentAfter = i === count - 1 ? after : undefined;
      const newPosition = this.generatePosition(currentBefore, currentAfter);
      positions.push(newPosition);
      currentBefore = newPosition;
    }

    return positions;
  }

  /**
   * Rebalance positions if they become too long
   */
  static rebalancePositions<T extends { id: string; position: string }>(
    items: T[],
    maxLength: number = 10
  ): Map<string, string> {
    const sortedItems = this.sortByPosition(items);
    const rebalanceMap = new Map<string, string>();
    
    // Check if rebalancing is needed
    const needsRebalancing = sortedItems.some(item => item.position.length > maxLength);
    
    if (!needsRebalancing) {
      return rebalanceMap;
    }

    console.log(`🔄 Rebalancing ${sortedItems.length} positions (max length: ${maxLength})`);
    
    // Generate new evenly spaced positions
    for (let i = 0; i < sortedItems.length; i++) {
      const before = i > 0 ? this.BASE_62[Math.floor(i / this.BASE_62.length)] + 
                               this.BASE_62[i % this.BASE_62.length] : undefined;
      const after = i < sortedItems.length - 1 ? this.BASE_62[Math.floor((i + 1) / this.BASE_62.length)] + 
                                                  this.BASE_62[(i + 1) % this.BASE_62.length] : undefined;
      
      const newPosition = this.generatePosition(before, after);
      rebalanceMap.set(sortedItems[i].id, newPosition);
    }
    
    return rebalanceMap;
  }

  /**
   * Convert fractional position string to numeric value for API compatibility
   * @param position Fractional position string
   * @returns Numeric position value
   */
  static positionToNumber(position: string): number {
    if (!position) return 1000;
    
    let result = 0;
    const base = this.BASE_62.length;
    
    for (let i = 0; i < position.length; i++) {
      const char = position[i];
      const value = this.BASE_62.indexOf(char);
      if (value === -1) {
        console.warn(`⚠️ Invalid character in position: ${char}`);
        continue;
      }
      result += value * Math.pow(base, -(i + 1));
    }
    
    // Scale to reasonable numeric range (0-1000000)
    const numericPosition = Math.round(result * 1000000);
    
    console.log(`🔢 Position conversion: "${position}" -> ${numericPosition}`);
    return numericPosition;
  }

  /**
   * Convert numeric position back to fractional string (for migration scenarios)
   * @param numericPosition Numeric position value
   * @returns Fractional position string
   */
  static numberToPosition(numericPosition: number): string {
    if (numericPosition <= 0) return this.MIN_CHAR;
    if (numericPosition >= 1000000) return this.MAX_CHAR;
    
    // Normalize to 0-1 range
    const normalized = numericPosition / 1000000;
    
    // Convert to base-62 fractional representation
    let result = '';
    let remaining = normalized;
    const base = this.BASE_62.length;
    
    for (let i = 0; i < 8 && remaining > 0; i++) {
      remaining *= base;
      const digit = Math.floor(remaining);
      remaining -= digit;
      result += this.BASE_62[digit];
    }
    
    return result || this.MID_POINT;
  }
}