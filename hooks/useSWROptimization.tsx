import { SWRConfig } from "swr";
import { useMemo } from "react";

/**
 * SWR Performance Optimizations
 *
 * Current Issues in /events/[eventId]:
 * - 3 sequential SWR calls causing waterfall loading
 * - No fallback data causing loading states
 * - Missing deduplication and caching optimizations
 */

// Global SWR Configuration for Performance
export const swrPerformanceConfig = {
  // Reduce network requests
  dedupingInterval: 60000, // 1 minute deduplication
  revalidateOnFocus: false,
  revalidateOnReconnect: true,

  // Error handling
  errorRetryCount: 3,
  errorRetryInterval: 1000,

  // Loading state optimizations
  loadingTimeout: 3000,

  // Cache optimization
  provider: () => new Map(),
  isVisible: () => true,
  isOnline: () => navigator.onLine,
};

// Coordinated Data Fetching Hook for Event Pages
export const useEventPageData = (eventId: string) => {
  const swrKeys = useMemo(
    () => ({
      event: eventId ? `events/${eventId}` : null,
      applicants: eventId ? `events/${eventId}/applicants` : null,
      gifts: eventId ? `events/${eventId}/gifts` : null,
    }),
    [eventId]
  );

  // Fallback data to prevent loading states
  const fallbackData = useMemo(() => {
    const data: Record<string, any> = {};
    if (swrKeys.event) data[swrKeys.event] = null;
    if (swrKeys.applicants)
      data[swrKeys.applicants] = { _tag: "Success", data: [] };
    if (swrKeys.gifts) data[swrKeys.gifts] = { _tag: "Success", data: [] };
    return data;
  }, [swrKeys]);

  return {
    swrKeys,
    fallbackData,
    config: {
      ...swrPerformanceConfig,
      fallback: fallbackData,
    },
  };
};

// Preload Strategy for Critical Data
export const preloadEventData = (eventId: string) => {
  const keys = [
    `events/${eventId}`,
    `events/${eventId}/applicants`,
    `events/${eventId}/gifts`,
  ];

  // Preload critical data
  keys.forEach((key) => {
    import("swr").then(({ mutate }) => {
      mutate(key);
    });
  });
};

// SWR Batch Fetcher for Related Data
export const batchFetcher = async (keys: string[]) => {
  const requests = keys.map((key) =>
    fetch(`/api/${key}`).then((res) => res.json())
  );

  const results = await Promise.allSettled(requests);

  return keys.reduce((acc, key, index) => {
    const result = results[index];
    acc[key] = result.status === "fulfilled" ? result.value : null;
    return acc;
  }, {} as Record<string, any>);
};

// Optimized SWR Provider Component
export const OptimizedSWRProvider = ({
  children,
  fallback = {},
}: {
  children: React.ReactNode;
  fallback?: Record<string, any>;
}) => {
  const config = useMemo(
    () => ({
      ...swrPerformanceConfig,
      fallback,
    }),
    [fallback]
  );

  return <SWRConfig value={config}>{children}</SWRConfig>;
};

// Usage example for events/[eventId] page:
/*
export default function EventPage({ params }: { params: { eventId: string } }) {
  const { swrKeys, config } = useEventPageData(params.eventId);
  
  return (
    <OptimizedSWRProvider fallback={config.fallback}>
      <EventPageContent eventId={params.eventId} />
    </OptimizedSWRProvider>
  );
}
*/
