import { ReactNode, FC } from "react";

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
const Section: SectionComponent = ({ children }: SectionProps) => {
  return <section className={SECTION_CONFIG.CSS_CLASS}>{children}</section>;
};

/**
 * Section.Title subcomponent for rendering section titles
 * @param props - Component props containing children
 * @returns JSX.Element - Rendered h1 element with children
 */
const SectionTitle: FC<SectionTitleProps> = ({ children }) => {
  return <h1>{children}</h1>;
};

// Attach the Title subcomponent to the main Section component
Section.Title = SectionTitle;

export default Section;
