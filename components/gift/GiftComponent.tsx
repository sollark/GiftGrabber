/**
 * GiftComponent.tsx
 *
 * Purpose: Presentational component for displaying individual gift information with owner and claim status
 *
 * Main Responsibilities:
 * - Renders gift owner information with first and last name display
 * - Shows gift availability status (claimed vs available) for user awareness
 * - Provides consistent gift display formatting across the application
 * - Maintains decoupled design for reusability in different contexts
 * - Implements defensive programming with null/undefined gift handling
 *
 * Architecture Role:
 * - Pure presentational component without business logic or state management
 * - Reusable UI component for gift lists, grids, and selection interfaces
 * - Foundation component for gift visualization in various application contexts
 * - Decoupled from context providers for maximum testability and flexibility
 * - Building block for complex gift management and selection workflows
 *
 * This file defines the GiftComponent, a presentational component for displaying a single gift's owner and claim status.
 *
 * Responsibilities:
 * - Render the owner's name and whether the gift is claimed or available
 * - Remain decoupled from context for reusability and testability
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

import { Gift } from "@/database/models/gift.model";
import { Box } from "@mui/material";
import { FC } from "react";

type GiftProps = {
  gift: Gift;
};

/**
 * Pure presentational component for individual gift display with owner and status information
 *
 * @param gift - Gift object containing owner and applicant information for display
 * @returns JSX.Element with formatted gift information or empty fragment if no gift
 *
 * @sideEffects None - pure presentational component with no state changes
 * @performance Lightweight component with minimal rendering overhead
 * @businessLogic Displays "Claimed" if applicant exists, "Available" otherwise
 * @notes Defensive programming handles null/undefined gift gracefully
 * @publicAPI Reusable component for gift display across different contexts
 */
const GiftComponent: FC<GiftProps> = ({ gift }) => {
  if (!gift) return <></>;

  const { owner, applicant } = gift;
  const giftStatus = applicant ? "Claimed" : "Available";

  return (
    <Box sx={{ padding: "1rem" }}>
      {`${owner.firstName} ${owner.lastName}: ${giftStatus}`}
    </Box>
  );
};

export default GiftComponent;
