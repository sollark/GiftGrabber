"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import {
  getEventDetails,
  getEventApplicants,
  getGifts,
} from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";
import { useApplicantActions } from "@/app/contexts/ApplicantContext";
import { useGiftActions } from "@/app/contexts/gift/GiftContext";
import { useEventActions } from "@/app/contexts/EventContext";

export default function ApplicantPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string | null>(null);

  // All hooks must be called unconditionally at the top
  const applicantActions = useApplicantActions();
  const giftActions = useGiftActions();
  const eventActions = useEventActions();

  useEffect(() => {
    params.then(({ eventId }) => setEventId(eventId));
  }, [params]);

  // SWR keys
  const eventKey = eventId ? `events/${eventId}` : null;
  const applicantsKey = eventId ? `events/${eventId}/applicants` : null;
  const giftsKey = eventId ? `events/${eventId}/gifts` : null;

  // Fetch event details
  const {
    data: event,
    error: eventError,
    isLoading: eventLoading,
  } = useSWR(eventKey, () => (eventId ? getEventDetails(eventId) : undefined), {
    revalidateOnFocus: false,
  });

  // Fetch applicants
  const {
    data: applicantsResult,
    error: applicantsError,
    isLoading: applicantsLoading,
  } = useSWR(
    applicantsKey,
    () => (eventId ? getEventApplicants(eventId) : undefined),
    { revalidateOnFocus: false }
  );

  // Fetch gifts
  const {
    data: giftsResult,
    error: giftsError,
    isLoading: giftsLoading,
  } = useSWR(giftsKey, () => (eventId ? getGifts(eventId) : undefined), {
    revalidateOnFocus: false,
  });

  // Memoize unwrapped results to avoid useEffect dependency warnings
  const applicants = useMemo(
    () =>
      applicantsResult && applicantsResult._tag === "Success"
        ? applicantsResult.value
        : [],
    [applicantsResult]
  );
  const gifts = useMemo(
    () =>
      giftsResult && giftsResult._tag === "Success" ? giftsResult.value : [],
    [giftsResult]
  );

  useEffect(() => {
    if (event && eventActions._tag === "Some") {
      eventActions.value.dispatchSafe({
        type: "SET_EVENT_DETAILS",
        payload: {
          name: event.name,
          email: event.email,
          eventId: event.publicId,
        },
      });
    }
    if (applicants.length && applicantActions._tag === "Some") {
      applicantActions.value.dispatchSafe({
        type: "SET_EVENT_APPLICANTS",
        payload: { applicantList: applicants },
      });
    }

    if (gifts.length && giftActions._tag === "Some") {
      giftActions.value.dispatchSafe({
        type: "SET_GIFT_LIST",
        payload: gifts,
      });
    }
  }, [event, applicants, gifts, eventActions, applicantActions, giftActions]);

  if (eventLoading || applicantsLoading || giftsLoading || !eventId)
    return <div>Loading...</div>;
  if (eventError || applicantsError || giftsError)
    return <div>Error loading event data</div>;
  if (!event) return <div>Event not found</div>;

  return <ApplicantPageClient />;
}
