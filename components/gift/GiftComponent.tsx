/**
 * GiftComponent.tsx
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
 * GiftComponent
 * Renders the owner's name and the claim status for a single gift.
 * @param gift - The gift object to display
 * @returns JSX element showing owner and status, or empty if no gift
 */
const GiftComponent: FC<GiftProps> = ({ gift }) => {
  if (!gift) return <></>;

  const { owner, receiver } = gift;
  const giftStatus = receiver ? "Claimed" : "Available";

  return (
    <Box sx={{ padding: "1rem" }}>
      {`${owner.firstName} ${owner.lastName}: ${giftStatus}`}
    </Box>
  );
};

export default GiftComponent;
