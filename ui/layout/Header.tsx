import { FC } from "react";
import Logo from "../data-display/Logo";

/**
 * Functional Header component.
 * Renders the site header with strict typing and composable structure.
 * Uses memo for performance.
 */
const Header: FC = () => (
  <header
    style={{
      paddingBlock: "1rem",
      paddingInline: "2rem",
    }}
  >
    <Logo />
  </header>
);

export default Header;
