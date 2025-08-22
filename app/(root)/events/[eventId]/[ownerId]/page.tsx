"use client";

import { useEffect, useState } from "react";
import { EventProvider } from "@/app/contexts/EventContext";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
import { GiftProvider } from "@/app/contexts/gift/GiftContext";
import OptimisticEventDetailsClient from "./OptimisticEventDetailsClient";

export default function EventDetails({
  params,
}: {
  params: Promise<{ eventId: string; ownerId: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{
    eventId: string;
    ownerId: string;
  } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  if (!resolvedParams) {
    return <div>Loading...</div>;
  }

  const { eventId, ownerId } = resolvedParams;

  // Use optimistic approach - render UI immediately with contexts
  // Data will be fetched client-side through context hooks
  return (
    <EventProvider eventId={eventId}>
      <ApproverProvider approverList={[]}>
        <GiftProvider giftList={[]}>
          <OptimisticEventDetailsClient eventId={eventId} ownerId={ownerId} />
        </GiftProvider>
      </ApproverProvider>
    </EventProvider>
  );
}
