"use client";
import React, { FC } from "react";
import { ApplicantProvider } from "@/app/contexts/ApplicantContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { GiftProvider } from "@/app/contexts/gift/GiftContext";

/**
 * Composes all app context providers into a single component.
 * @param children - React children to be wrapped by providers
 * @returns Children wrapped in all context providers
 */
const AppProviders: FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApplicantProvider>
    <EventProvider>
      <GiftProvider>{children}</GiftProvider>
    </EventProvider>
  </ApplicantProvider>
);

export default AppProviders;
