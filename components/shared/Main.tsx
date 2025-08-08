import { FC, ReactNode, memo } from "react";

type MainProps = {
  children: ReactNode;
};

/**
 * Functional Main component.
 * Renders the main content area with strict typing and composable structure.
 * Uses memo for performance.
 */
const Main: FC<MainProps> = ({ children }) => (
  <main
    style={{
      flexGrow: 1,
      paddingBlock: "1rem",
      paddingInline: "2rem",
      paddingBottom: "10rem",
    }}
  >
    {children}
  </main>
);

export default Main;
