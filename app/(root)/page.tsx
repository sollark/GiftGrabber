/**
 * page.tsx (root)
 *
 * Purpose: Home page component for the GiftGrabber application
 *
 * Main Responsibilities:
 * - Renders the main landing page with hero section content
 * - Serves as entry point for new users and event creation workflow
 * - Provides clean, minimal interface focused on primary user actions
 * - Integrates with UI layout components for consistent design system
 *
 * Architecture Role:
 * - Root route ("/") in Next.js app router structure
 * - First component loaded when users visit the application
 * - Gateway to event creation and management workflows
 * - Foundation for user onboarding and feature discovery
 */

import { HeroSection } from "@/ui/layout";
import { FC } from "react";

/**
 * Home page component providing the main landing interface
 *
 * @returns JSX.Element containing the hero section for user engagement
 *
 * @sideEffects None - pure presentational component
 * @performance Lightweight component with minimal bundle impact
 * @notes Delegates content rendering to HeroSection component for separation of concerns
 * @publicAPI Root page component rendered by Next.js app router
 */
const Home: FC = () => {
  return <HeroSection />;
};

export default Home;
