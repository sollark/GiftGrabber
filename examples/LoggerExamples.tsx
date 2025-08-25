"use client";
import React from "react";
import logger from "@/lib/logger";

/**
 * LoggerExamples - Demonstrates usage of the logger service in the browser console.
 */
export const LoggerDemo: React.FC = () => (
  <div style={{ margin: "1rem 0" }}>
    <button
      onClick={() => {
        logger.log("This is a normal log");
        logger.info("This is an info log");
        logger.warn("This is a warning");
        logger.error("This is an error");
        logger.important("This is an IMPORTANT message!");
      }}
      style={{
        padding: "0.5rem 1rem",
        fontWeight: "bold",
        border: "1px solid #ccc",
        borderRadius: 4,
      }}
    >
      Test Logger (see browser console)
    </button>
  </div>
);

export default LoggerDemo;
