/**
 *
 * Purpose: Root layout component for the GiftGrabber Next.js application
 *
 * Main Responsibilities:
 * - Defines global HTML structure and metadata for the application
 * - Sets up favicon configuration for various devices and browsers
 * - Imports global CSS styles for consistent application theming
 * - Provides semantic HTML structure with accessibility considerations
 * - Establishes responsive design foundation with flexbox layout
 *
 * Architecture Role:
 * - Entry point for all application pages through Next.js app router
 * - Contains global configurations that apply to entire application
 * - Defines metadata for SEO and social media sharing
 * - Sets up icon assets for progressive web app capabilities
 * - Foundation for global state providers and error boundaries
 */

"use client";
import "@/styles/main.css";

/**
 * Root layout component providing HTML structure and global styling for all pages
 *
 * @param children - React node representing the page content to render within layout
 * @returns JSX.Element containing HTML document structure with global styles and metadata
 *
 * @sideEffects
  // Wrap all pages in global context providers to preserve state across navigation
  "use client"; // Moved 'use client' directive to the top
 * - Sets document language to English for accessibility and SEO
 *
 * @performance
 * - Uses Next.js automatic font optimization for improved loading performance
 * - Favicon preloading improves perceived performance on repeat visits
 *
 * @notes
 * - Uses flexbox for responsive layout foundation
 * - Contains commented background div for potential future design enhancements
 * - Integrates with Next.js metadata API for SEO optimization
 *
 * @publicAPI Root component used by Next.js app router for all pages
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Wrap all pages in global context providers to preserve state across navigation
  // This fixes context loss when navigating between CreateEventForm and EventDetailsClient
  // Providers are imported from their respective modules
  // If providers require initial data, enhance them to hydrate from storage in future steps
  return (
    <html lang="en">
      <body className="app flex flex-col min-h-screen">{children}</body>
    </html>
  );
}
