"use client";
import LoggerDemo from "@/examples/LoggerExamples";
import { FC } from "react";

/**
 * LoggerTestPage
 * Renders the LoggerDemo example component for demonstration purposes.
 * @returns JSX.Element
 * @publicAPI
 */
const LoggerTestPage: FC = () => {
  return (
    <div>
      <LoggerDemo />
    </div>
  );
};

export default LoggerTestPage;
