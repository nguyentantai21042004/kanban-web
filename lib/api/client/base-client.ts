import { RequestUtils, RequestOptions } from '../utils/request'
import { logger } from '../utils/logger'

export abstract class BaseClient {
  protected async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    return RequestUtils.request<T>(endpoint, options)
  }

  protected createUrlWithParams(endpoint: string, params?: Record<string, any>): string {
    return RequestUtils.createUrlWithParams(endpoint, params)
  }

  protected logMethodCall(methodName: string, data?: any): void {
    logger.info(`${this.constructor.name}.${methodName} called`, data)
  }

  protected logError(methodName: string, error: any): void {
    logger.error(`${this.constructor.name}.${methodName} failed`, error)
  }
} 