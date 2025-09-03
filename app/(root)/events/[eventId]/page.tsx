"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import {
  getEventDetails,
  getEventApplicants,
  getGifts,
} from "@/app/actions/event.action";
import ApplicantPageClient from "./ApplicantPageClient";
import { useApplicantContext } from "@/app/contexts/ApplicantContext";
import { useGiftContext } from "@/app/contexts/gift/GiftContext";
import { useEventContext } from "@/app/contexts/EventContext";
import ErrorMessage from "@/components/ui/ErrorMessage";

export default function ApplicantPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const [eventId, setEventId] = useState<string | null>(null);
  const applicantContext = useApplicantContext();
  const giftContext = useGiftContext();
  const eventContext = useEventContext();

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
    if (event && event._tag === "Success") {
      eventContext.dispatch({
        type: "SET_EVENT_DETAILS",
        payload: {
          name: event.value.name,
          email: event.value.email,
          eventId: event.value.publicId,
        },
      });
    }
    if (applicants.length) {
      applicantContext.dispatch({
        type: "SET_EVENT_APPLICANTS",
        payload: { applicantList: applicants },
      });
    }

    if (gifts.length) {
      giftContext.dispatch({
        type: "SET_GIFT_LIST",
        payload: gifts,
      });
    }
  }, [event, applicants, gifts, eventContext, applicantContext, giftContext]);

  if (eventLoading || applicantsLoading || giftsLoading || !eventId)
    return <div>Loading...</div>;
  if (eventError || applicantsError || giftsError)
    return <ErrorMessage message="Error loading event data" />;
  if (!event) return <ErrorMessage message="Event not found" />;

  return <ApplicantPageClient />;
}
