"use client";
import React, { FC } from "react";
import { ApplicantProvider } from "@/app/contexts/ApplicantContext";
import { ApproverProvider } from "@/app/contexts/ApproverContext";
import { EventProvider } from "@/app/contexts/EventContext";
import { GiftProvider } from "@/app/contexts/gift/GiftContext";
import { useEventActions } from "@/app/contexts/EventContext";
import { useApplicantActions } from "@/app/contexts/ApplicantContext";
import { useApproverActions } from "@/app/contexts/ApproverContext";

/**
 * Composes all app context providers into a single component.
 * @param children - React children to be wrapped by providers
 * @returns Children wrapped in all context providers
 */
const AppProviders: FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApplicantProvider>
    <ApproverProvider>
      <EventProvider>
        <GiftProvider>{children}</GiftProvider>
      </EventProvider>
    </ApproverProvider>
  </ApplicantProvider>
);

export default AppProviders;
