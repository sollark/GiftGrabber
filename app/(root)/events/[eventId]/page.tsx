"use client";

import useSWR from "swr";
import { useState, useEffect } from "react";
import { getEventDetails } from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";

export default function ApplicantPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string | null>(null);

  // Resolve eventId from params (still async)
  useEffect(() => {
    params.then(({ eventId }) => setEventId(eventId));
  }, [params]);

  // Creates a cache key for event data fetching
  const createEventCacheKey = (eventId: string): string => `events/${eventId}`;

  // Fetch event data with SWR (string key style)
  const {
    data: event,
    error,
    isLoading,
  } = useSWR(
    () => (eventId ? createEventCacheKey(eventId) : null),
    () => (eventId ? getEventDetails(eventId) : undefined),
    { revalidateOnFocus: false }
  );

  if (isLoading || !eventId) return <div>Loading...</div>;
  if (error) return <div>Error loading event</div>;
  if (!event) return <div>Event not found</div>;

  return <ApplicantPageClient event={event} />;
}
