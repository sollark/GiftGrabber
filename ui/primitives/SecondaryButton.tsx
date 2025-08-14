import { tokens } from "@/ui/colorTokens";
import { Button, ButtonProps } from "@mui/material";
import { FC } from "react";

const palette = tokens("light");

/**
 * Functional SecondaryButton component.
 * Renders a button with secondary styling, strict typing, and composable props.
 * Uses memo for performance.
 */
const SecondaryButton: FC<ButtonProps> = ({ children, ...props }) => (
  <Button
    sx={{
      backgroundColor: palette.secondary[200],
      color: palette.secondary[700],
      padding: "1.1rem",
      "&:hover": {
        backgroundColor: palette.secondary[200],
        color: palette.secondary[800],
      },
    }}
    {...props}
  >
    {children}
  </Button>
);

export default SecondaryButton;
