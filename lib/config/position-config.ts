/**
 * Position Management Configuration
 * Centralized configuration for all position-related settings
 */

export interface PositionConfig {
  // Core Algorithm Settings
  algorithm: 'fractional_indexing' | 'decimal' | 'uuid_ordering';
  base: number;
  maxLength: number;
  rebalanceThreshold: number;

  // Feature Flags
  enableEnhancedPositioning: boolean;
  enableOptimisticUpdates: boolean;
  enablePerformanceMetrics: boolean;
  enableDebugLogging: boolean;
  enableBatchMoves: boolean;

  // WebSocket Settings
  wsReconnectAttempts: number;
  wsReconnectDelay: number;
  wsConnectionTimeout: number;

  // Performance Settings
  dragDebounceMs: number;
  cleanupIntervalMs: number;
  
  // Conflict Resolution
  conflictResolutionStrategy: 'timestamp' | 'user_priority' | 'server_wins' | 'client_wins';
}

// Default configuration
const defaultConfig: PositionConfig = {
  algorithm: 'fractional_indexing',
  base: 62,
  maxLength: 8,
  rebalanceThreshold: 5,
  
  enableEnhancedPositioning: true,
  enableOptimisticUpdates: true,
  enablePerformanceMetrics: true,
  enableDebugLogging: false,
  enableBatchMoves: false,
  
  wsReconnectAttempts: 5,
  wsReconnectDelay: 1000,
  wsConnectionTimeout: 10000,
  
  dragDebounceMs: 50,
  cleanupIntervalMs: 30000,
  
  conflictResolutionStrategy: 'timestamp'
};

// Load configuration from environment variables
function loadConfigFromEnv(): Partial<PositionConfig> {
  if (typeof window === 'undefined') {
    return {}; // Server-side, use defaults
  }

  const envConfig: Partial<PositionConfig> = {};

  // Algorithm settings
  const algorithm = process.env.NEXT_PUBLIC_POSITION_ALGORITHM as PositionConfig['algorithm'];
  if (algorithm) envConfig.algorithm = algorithm;

  const base = process.env.NEXT_PUBLIC_POSITION_BASE;
  if (base) envConfig.base = parseInt(base, 10);

  const maxLength = process.env.NEXT_PUBLIC_POSITION_MAX_LENGTH;
  if (maxLength) envConfig.maxLength = parseInt(maxLength, 10);

  const rebalanceThreshold = process.env.NEXT_PUBLIC_POSITION_REBALANCE_THRESHOLD;
  if (rebalanceThreshold) envConfig.rebalanceThreshold = parseInt(rebalanceThreshold, 10);

  // Feature flags
  const enhancedPositioning = process.env.NEXT_PUBLIC_ENABLE_ENHANCED_POSITIONING;
  if (enhancedPositioning) envConfig.enableEnhancedPositioning = enhancedPositioning === 'true';

  const optimisticUpdates = process.env.NEXT_PUBLIC_ENABLE_OPTIMISTIC_UPDATES;
  if (optimisticUpdates) envConfig.enableOptimisticUpdates = optimisticUpdates === 'true';

  const performanceMetrics = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_METRICS;
  if (performanceMetrics) envConfig.enablePerformanceMetrics = performanceMetrics === 'true';

  const debugPositioning = process.env.NEXT_PUBLIC_DEBUG_POSITIONING;
  if (debugPositioning) envConfig.enableDebugLogging = debugPositioning === 'true';

  const batchMoveEnabled = process.env.NEXT_PUBLIC_BATCH_MOVE_ENABLED;
  if (batchMoveEnabled) envConfig.enableBatchMoves = batchMoveEnabled === 'true';

  // WebSocket settings
  const wsReconnectAttempts = process.env.NEXT_PUBLIC_WS_RECONNECT_ATTEMPTS;
  if (wsReconnectAttempts) envConfig.wsReconnectAttempts = parseInt(wsReconnectAttempts, 10);

  const wsReconnectDelay = process.env.NEXT_PUBLIC_WS_RECONNECT_DELAY;
  if (wsReconnectDelay) envConfig.wsReconnectDelay = parseInt(wsReconnectDelay, 10);

  const wsConnectionTimeout = process.env.NEXT_PUBLIC_WS_CONNECTION_TIMEOUT;
  if (wsConnectionTimeout) envConfig.wsConnectionTimeout = parseInt(wsConnectionTimeout, 10);

  // Performance settings
  const dragDebounceMs = process.env.NEXT_PUBLIC_DRAG_DEBOUNCE_MS;
  if (dragDebounceMs) envConfig.dragDebounceMs = parseInt(dragDebounceMs, 10);

  const cleanupIntervalMs = process.env.NEXT_PUBLIC_CLEANUP_INTERVAL_MS;
  if (cleanupIntervalMs) envConfig.cleanupIntervalMs = parseInt(cleanupIntervalMs, 10);

  // Conflict resolution
  const conflictStrategy = process.env.NEXT_PUBLIC_CONFLICT_RESOLUTION_STRATEGY as PositionConfig['conflictResolutionStrategy'];
  if (conflictStrategy) envConfig.conflictResolutionStrategy = conflictStrategy;

  return envConfig;
}

// Create final configuration
export const positionConfig: PositionConfig = {
  ...defaultConfig,
  ...loadConfigFromEnv()
};

// Configuration utilities
export class PositionConfigManager {
  private static instance: PositionConfigManager;
  private config: PositionConfig;

  private constructor() {
    this.config = { ...positionConfig };
  }

  static getInstance(): PositionConfigManager {
    if (!PositionConfigManager.instance) {
      PositionConfigManager.instance = new PositionConfigManager();
    }
    return PositionConfigManager.instance;
  }

  getConfig(): PositionConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<PositionConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (this.config.enableDebugLogging) {
      console.log('🎯 Position config updated:', updates);
    }
  }

  isFeatureEnabled(feature: keyof PositionConfig): boolean {
    return Boolean(this.config[feature]);
  }

  getPerformanceConfig() {
    return {
      dragDebounceMs: this.config.dragDebounceMs,
      cleanupIntervalMs: this.config.cleanupIntervalMs,
      enablePerformanceMetrics: this.config.enablePerformanceMetrics
    };
  }

  getWebSocketConfig() {
    return {
      reconnectAttempts: this.config.wsReconnectAttempts,
      reconnectDelay: this.config.wsReconnectDelay,
      connectionTimeout: this.config.wsConnectionTimeout
    };
  }

  getAlgorithmConfig() {
    return {
      algorithm: this.config.algorithm,
      base: this.config.base,
      maxLength: this.config.maxLength,
      rebalanceThreshold: this.config.rebalanceThreshold
    };
  }

  // Validation
  validateConfig(): string[] {
    const errors: string[] = [];

    if (this.config.base < 2 || this.config.base > 62) {
      errors.push('Base must be between 2 and 62');
    }

    if (this.config.maxLength < 1 || this.config.maxLength > 50) {
      errors.push('Max length must be between 1 and 50');
    }

    if (this.config.rebalanceThreshold < 1) {
      errors.push('Rebalance threshold must be at least 1');
    }

    if (this.config.dragDebounceMs < 0 || this.config.dragDebounceMs > 1000) {
      errors.push('Drag debounce must be between 0 and 1000ms');
    }

    if (this.config.wsReconnectAttempts < 0 || this.config.wsReconnectAttempts > 20) {
      errors.push('WebSocket reconnect attempts must be between 0 and 20');
    }

    return errors;
  }

  // Development helpers
  dumpConfig(): void {
    console.table(this.config);
  }

  resetToDefaults(): void {
    this.config = { ...defaultConfig };
    console.log('🔄 Position config reset to defaults');
  }
}

// Export singleton instance
export const positionConfigManager = PositionConfigManager.getInstance();

// Debug helper for development
if (typeof window !== 'undefined' && positionConfig.enableDebugLogging) {
  (window as any).positionConfig = positionConfig;
  (window as any).positionConfigManager = positionConfigManager;
  console.log('🎯 Position config loaded:', positionConfig);
}