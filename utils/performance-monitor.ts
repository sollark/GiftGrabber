/**
 * Performance Monitoring Utilities
 *
 * Tracks the key performance issues identified:
 * 1. Bundle size impact on loading
 * 2. Component render performance
 * 3. SWR data fetching efficiency
 * 4. Memory usage and leaks
 */

import logger from "@/lib/logger";

interface PerformanceMetrics {
  bundleLoadTime: number;
  componentRenderTime: number;
  dataFetchTime: number;
  memoryUsage: number;
  firstLoadJS: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];

  // Bundle Loading Performance
  measureBundleLoad() {
    if (typeof window !== "undefined") {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;
      this.metrics.bundleLoadTime =
        navigation.loadEventEnd - navigation.loadEventStart;

      // Log performance issues
      if (this.metrics.bundleLoadTime > 3000) {
        console.warn(
          `Slow bundle load detected: ${this.metrics.bundleLoadTime}ms (>3s threshold)`
        );
      }
    }
  }

  // Component Render Performance
  measureComponentRender(componentName: string, renderTime: number) {
    if (renderTime > 16) {
      // Slower than 60fps
      console.warn(
        `Slow component render: ${componentName} took ${renderTime}ms (>16ms threshold)`
      );
    }

    this.metrics.componentRenderTime = renderTime;
  }

  // Data Fetching Performance
  measureDataFetch(endpoint: string, startTime: number, endTime: number) {
    const fetchTime = endTime - startTime;

    if (fetchTime > 1000) {
      // Slower than 1s
      console.warn(
        `Slow data fetch: ${endpoint} took ${fetchTime}ms (>1s threshold)`
      );
    }

    this.metrics.dataFetchTime = fetchTime;
  }

  // Memory Usage Tracking
  measureMemoryUsage() {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      this.metrics.memoryUsage = memory.usedJSHeapSize;

      // Log memory issues
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
        // 50MB
        console.warn(
          `High memory usage detected: ${(
            memory.usedJSHeapSize /
            1024 /
            1024
          ).toFixed(2)}MB`
        );
      }
    }
  }

  // First Load JS Measurement
  measureFirstLoadJS() {
    if (typeof window !== "undefined") {
      const resources = performance.getEntriesByType(
        "resource"
      ) as PerformanceResourceTiming[];
      const jsResources = resources.filter(
        (resource) =>
          resource.name.includes(".js") && resource.name.includes("/_next/")
      );

      const totalJSSize = jsResources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);

      this.metrics.firstLoadJS = totalJSSize;

      if (totalJSSize > 500 * 1024) {
        // 500KB
        console.warn(
          `Large First Load JS detected: ${(totalJSSize / 1024).toFixed(
            2
          )}KB (>500KB threshold)`
        );
      }
    }
  }

  // Long Task Detection
  observeLongTasks() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 50) {
            // Tasks longer than 50ms
            console.warn(
              `Long task detected: ${entry.duration}ms (>50ms threshold)`
            );
          }
        });
      });

      observer.observe({ entryTypes: ["longtask"] });
      this.observers.push(observer);
    }
  }

  // Layout Shift Detection
  observeLayoutShifts() {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        let clsScore = 0;
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value;
          }
        });

        if (clsScore > 0.1) {
          // CLS threshold
          console.warn(
            `High Cumulative Layout Shift detected: ${clsScore.toFixed(
              3
            )} (>0.1 threshold)`
          );
        }
      });

      observer.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(observer);
    }
  }

  // Start comprehensive monitoring
  startMonitoring() {
    if (typeof window === "undefined") return;

    // Initial measurements
    this.measureBundleLoad();
    this.measureFirstLoadJS();
    this.measureMemoryUsage();

    // Continuous monitoring
    this.observeLongTasks();
    this.observeLayoutShifts();

    // Periodic memory checks
    setInterval(() => {
      this.measureMemoryUsage();
    }, 10000); // Every 10 seconds

    logger.info("Performance monitoring started");
  }

  // Stop monitoring and cleanup
  stopMonitoring() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  // Get current metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Generate performance report
  generateReport(): string {
    const report = [
      "=== Performance Audit Report ===",
      `Bundle Load Time: ${this.metrics.bundleLoadTime || "N/A"}ms`,
      `Component Render Time: ${this.metrics.componentRenderTime || "N/A"}ms`,
      `Data Fetch Time: ${this.metrics.dataFetchTime || "N/A"}ms`,
      `Memory Usage: ${
        this.metrics.memoryUsage
          ? (this.metrics.memoryUsage / 1024 / 1024).toFixed(2) + "MB"
          : "N/A"
      }`,
      `First Load JS: ${
        this.metrics.firstLoadJS
          ? (this.metrics.firstLoadJS / 1024).toFixed(2) + "KB"
          : "N/A"
      }`,
      "================================",
    ].join("\n");

    return report;
  }
}

// Global instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in components
export const measureComponentPerformance = (
  componentName: string,
  renderTime: number
) => {
  performanceMonitor.measureComponentRender(componentName, renderTime);
};

export const measureDataFetchPerformance = (
  endpoint: string,
  startTime: number,
  endTime: number
) => {
  performanceMonitor.measureDataFetch(endpoint, startTime, endTime);
};

export const startMonitoring = () => {
  performanceMonitor.startMonitoring();
};

export const getPerformanceReport = () => {
  return performanceMonitor.generateReport();
};

export default performanceMonitor;
