// ============================================================================
// BATCH PROCESSOR - Chunked Processing Utilities
// ============================================================================
// Utilities for processing large datasets in batches with progress tracking
// ============================================================================

import { Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const logger = new Logger('BatchProcessor');

export interface BatchProcessorOptions {
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void;
  onChunkComplete?: (chunkIndex: number, chunkSize: number) => void;
  delayBetweenChunks?: number;
}

export interface BatchResult<T> {
  successful: T[];
  failed: { item: any; error: string }[];
  total: number;
  successCount: number;
  failureCount: number;
}

export class BatchProcessor {
  static async processInChunks<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    options: BatchProcessorOptions = {},
  ): Promise<R[]> {
    const {
      chunkSize = 100,
      onProgress,
      onChunkComplete,
      delayBetweenChunks = 0,
    } = options;
    const results: R[] = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkIndex = Math.floor(i / chunkSize);

      try {
        const chunkResults = await processor(chunk);
        results.push(...chunkResults);

        processed += chunk.length;
        onProgress?.(processed, items.length);
        onChunkComplete?.(chunkIndex, chunk.length);

        if (delayBetweenChunks > 0 && i + chunkSize < items.length) {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenChunks),
          );
        }
      } catch (error) {
        logger.error(`Error processing chunk ${chunkIndex}:`, error);
        throw error;
      }
    }

    return results;
  }

  static async processWithRetry<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    options: BatchProcessorOptions & { maxRetries?: number } = {},
  ): Promise<BatchResult<R>> {
    const { chunkSize = 100, onProgress, maxRetries = 3 } = options;
    const successful: R[] = [];
    const failed: { item: T; error: string }[] = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      await Promise.all(
        chunk.map(async (item) => {
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const result = await processor(item);
              successful.push(result);
              return;
            } catch (error) {
              lastError = error as Error;
              if (attempt < maxRetries - 1) {
                await new Promise((resolve) =>
                  setTimeout(resolve, Math.pow(2, attempt) * 100),
                );
              }
            }
          }

          failed.push({ item, error: lastError?.message || 'Unknown error' });
        }),
      );

      processed += chunk.length;
      onProgress?.(processed, items.length);
    }

    return {
      successful,
      failed,
      total: items.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  static async processWithTransaction<T, R>(
    prisma: PrismaService,
    items: T[],
    processor: (tx: any, item: T) => Promise<R>,
    options: BatchProcessorOptions & {
      maxRetries?: number;
      transactionTimeout?: number;
    } = {},
  ): Promise<BatchResult<R>> {
    const {
      chunkSize = 50,
      onProgress,
      maxRetries = 3,
      transactionTimeout = 30000,
    } = options;
    const successful: R[] = [];
    const failed: { item: T; error: string }[] = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      try {
        const results = await prisma.$transaction(
          async (tx) => {
            return Promise.all(chunk.map((item) => processor(tx, item)));
          },
          { timeout: transactionTimeout, maxWait: 5000 },
        );
        successful.push(...results);
      } catch (error) {
        // Process items individually on chunk failure
        logger.warn(
          `Chunk transaction failed, processing individually: ${error}`,
        );

        for (const item of chunk) {
          let lastError: Error | null = null;

          for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
              const result = await prisma.$transaction(
                (tx) => processor(tx, item),
                { timeout: transactionTimeout },
              );
              successful.push(result);
              break;
            } catch (itemError) {
              lastError = itemError as Error;
              if (attempt === maxRetries - 1) {
                failed.push({ item, error: lastError.message });
              }
            }
          }
        }
      }

      processed += chunk.length;
      onProgress?.(processed, items.length);
    }

    return {
      successful,
      failed,
      total: items.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  }

  static async mapWithConcurrency<T, R>(
    items: T[],
    mapper: (item: T, index: number) => Promise<R>,
    concurrency: number = 5,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let currentIndex = 0;

    async function worker() {
      while (currentIndex < items.length) {
        const index = currentIndex++;
        results[index] = await mapper(items[index], index);
      }
    }

    await Promise.all(
      Array.from({ length: Math.min(concurrency, items.length) }, worker),
    );
    return results;
  }
}
