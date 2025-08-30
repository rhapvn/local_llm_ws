import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Memory monitoring utilities for RAG operations
 */
export const memoryUtils = {
  /**
   * Get current memory usage information
   */
  getMemoryInfo: () => {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      return {
        rss: Math.round(memUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
      };
    }
    return null;
  },

  /**
   * Log memory usage with a label
   */
  logMemoryUsage: (label: string) => {
    const memInfo = memoryUtils.getMemoryInfo();
    if (memInfo) {
      console.log(`🧠 Memory Usage [${label}]:`, {
        RSS: `${memInfo.rss} MB`,
        HeapUsed: `${memInfo.heapUsed} MB`,
        HeapTotal: `${memInfo.heapTotal} MB`,
        External: `${memInfo.external} MB`,
      });
    }
  },

  /**
   * Check if memory usage is high
   */
  isMemoryHigh: (thresholdMB: number = 500) => {
    const memInfo = memoryUtils.getMemoryInfo();
    if (memInfo) {
      return memInfo.heapUsed > thresholdMB;
    }
    return false;
  },

  /**
   * Force garbage collection if available
   */
  forceGC: () => {
    if (global.gc) {
      global.gc();
      console.log("🧹 Forced garbage collection");
      return true;
    }
    return false;
  },

  /**
   * Memory usage warning
   */
  warnHighMemory: (thresholdMB: number = 500) => {
    const memInfo = memoryUtils.getMemoryInfo();
    if (memInfo && memInfo.heapUsed > thresholdMB) {
      console.warn(`⚠️ High memory usage detected: ${memInfo.heapUsed} MB (threshold: ${thresholdMB} MB)`);
      return true;
    }
    return false;
  },
};
