"use client";
/**
 * page.tsx - Event Creation Page
 *
 * Purpose: Client-side page component for event creation workflow
 *
 * Main Responsibilities:
 * - Provides the main interface for creating new gift exchange events
 * - Renders event creation form with proper layout structure
 * - Serves as entry point for event organizer workflow
 * - Integrates with design system components for consistent UI
 *
 * Architecture Role:
 * - Primary page for event creation in the application flow
 * - Bridge between routing system and event creation functionality
 * - Foundation for event organizer onboarding and setup process
 * - Entry point for Excel import and event configuration workflows
 */

import { FC } from "react";
import { Section } from "@/ui/layout";
import CreateEventForm from "@/components/event/CreateEventForm";
import ErrorBoundary from "@/components/ErrorBoundary";
import logger from "@/lib/logger";

/**
 * Event creation page component with form and layout structure
 *
 * @returns JSX.Element containing section layout with event creation form
 * @sideEffects None - pure presentational component
 * @performance Lightweight component delegating heavy lifting to CreateEventForm
 * @notes Uses Section layout component for consistent page structure and styling
 * @publicAPI Next.js page component rendered by app router at /create route
 */
const CreatePage: FC = () => {
  console.log("🔥 [IMPORTANT] Rendering Create Event Page");

  return (
    <Section>
      <Section.Title>Create New Event</Section.Title>
      <ErrorBoundary>
        <CreateEventForm />
      </ErrorBoundary>
    </Section>
  );
};

export default CreatePage;
