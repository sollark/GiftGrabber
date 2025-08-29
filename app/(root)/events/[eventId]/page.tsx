"use client";
"use client";

import { useEffect, useState } from "react";
import { getEventDetails } from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";
import { Event } from "@/database/models/event.model";

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
