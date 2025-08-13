import { tokens } from "@/ui/colorTokens";
import { Button, ButtonProps } from "@mui/material";
import { FC, memo } from "react";

const palette = tokens("light");

/**
 * Functional AccentButton component.
 * Renders a button with accent styling, strict typing, and composable props.
 * Uses memo for performance.
 */
const AccentButton: FC<ButtonProps> = ({ children, ...props }) => (
  <Button
    sx={{
      backgroundColor: palette.accent[500],
      color: "white",
      padding: "1rem",
      "&:hover": {
        backgroundColor: palette.accent[400],
        color: "black",
      },
    }}
    {...props}
  >
    {children}
  </Button>
);

export default AccentButton;
