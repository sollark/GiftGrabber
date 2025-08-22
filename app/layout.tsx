/**
 * layout.tsx
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

import "@/styles/main.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gift Grabber",
  description:
    "Employee gifting platform for a seamless workplace gift-sharing experience.",
  icons: [
    {
      rel: "icon",
      type: "image/png",
      sizes: "32x32",
      url: "/assets/favicons/favicon-32x32.png",
    },
    {
      rel: "icon",
      type: "image/png",
      sizes: "16x16",
      url: "/assets/favicons/favicon-16x16.png",
    },
    {
      rel: "apple-touch-icon",
      url: "/assets/favicons/apple-touch-icon.png",
    },
    { rel: "manifest", url: "/assets/favicons/site.webmanifest" },
  ],
};

/**
 * Root layout component providing HTML structure and global styling for all pages
 *
 * @param children - React node representing the page content to render within layout
 * @returns JSX.Element containing HTML document structure with global styles and metadata
 *
 * @sideEffects
 * - Imports global CSS styles that apply to entire application
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="app flex flex-col min-h-screen">
        {/* <div className='background' /> */}
        {children}
      </body>
    </html>
  );
}
