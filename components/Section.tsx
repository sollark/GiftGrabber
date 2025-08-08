import { ReactNode, FC, memo } from "react";

/**
 * Configuration constants for the Section component
 */
const SECTION_CONFIG = {
  CSS_CLASS: "main-section",
} as const;

/**
 * Props interface for the main Section component
 */
interface SectionProps {
  children: ReactNode;
}

/**
 * Props interface for the Section.Title subcomponent
 */
interface SectionTitleProps {
  children: ReactNode;
}

/**
 * Type definition for the compound Section component
 */
interface SectionComponent extends FC<SectionProps> {
  Title: FC<SectionTitleProps>;
}

/**
 * Main Section component that renders a semantic section element
 * @param props - Component props containing children
 * @returns JSX.Element - Rendered section with children
 */

const SectionBase: FC<SectionProps> = memo(({ children }) => (
  <section className={SECTION_CONFIG.CSS_CLASS}>{children}</section>
));

const SectionTitle: FC<SectionTitleProps> = memo(({ children }) => (
  <h1>{children}</h1>
));

const Section = SectionBase as SectionComponent;
Section.Title = SectionTitle;

export default Section;
