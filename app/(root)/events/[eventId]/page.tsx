"use client";

import { useEffect, useState } from "react";
import { getEventDetails } from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";
import { Event } from "@/database/models/event.model";

// User's original type for reference (not used by Next.js, but preserved as requested)
type SearchParamProps = {
  params: {
    eventId: string;
  };
};

export default function ApplicantPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then(({ eventId }) => {
      setEventId(eventId);
      getEventDetails(eventId)
        .then(setEvent)
        .finally(() => setLoading(false));
    });
  }, [params]);

  if (loading) return <div>Loading...</div>;
  if (!event) return <div>Event not found</div>;

  return <ApplicantPageClient event={event} />;
}
