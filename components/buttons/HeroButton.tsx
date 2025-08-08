"use client";
import { FC, memo } from "react";
import { useRouter } from "next/navigation";
import AccentButton from "./AccentButton";

/**
 * Functional HeroButton component.
 * Navigates to the event creation page with strict typing and composable props.
 * Uses memo for performance.
 */
const HeroButton: FC = () => {
  const router = useRouter();
  return (
    <AccentButton
      className="hero-button"
      onClick={() => router.push("/create")}
    >
      Create an event
    </AccentButton>
  );
};

export default HeroButton;
