import { tokens } from "@/ui/colorTokens";
import { Button, ButtonProps } from "@mui/material";
import { FC } from "react";

const palette = tokens("light");

/**
 * Functional PrimaryButton component.
 * Renders a button with primary styling, strict typing, and composable props.
 * Uses memo for performance.
 */
const PrimaryButton: FC<ButtonProps> = ({ children, ...props }) => (
  <Button
    sx={{
      backgroundColor: palette.primary[200],
      color: palette.primary[700],
      padding: "1rem",
      "&:hover": {
        backgroundColor: palette.primary[200],
        color: palette.primary[800],
      },
    }}
    {...props}
  >
    {children}
  </Button>
);

export default PrimaryButton;
