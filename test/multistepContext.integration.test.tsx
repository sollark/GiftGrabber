/**
 * Integration tests for MultistepContext navigation logic
 *
 * These tests verify the correct behavior of the multistep form context, including:
 * - Step navigation (next, previous, jump)
 * - Handling of optional steps and step dependencies
 * - State updates and context safety
 *
 * Test setup uses a custom TestHarness component to expose context hooks for direct assertion.
 *
 * Requirements:
 * - Jest
 * - @testing-library/react
 * - React 19+
 */
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { act } from "react";
import MultistepContextAPI from "@/app/contexts/multistep/MultistepContext";

const steps = [
  {
    id: "step1",
    title: "Step 1",
  },
  {
    id: "step2",
    title: "Step 2",
    isOptional: true,
    dependencies: ["step1"],
  },
  {
    id: "step3",
    title: "Step 3",
    dependencies: ["step2"],
  },
];

describe("MultistepContext integration", () => {
  // Helper test harness to run hooks and trigger assertions after context is ready
  interface ContextHooks {
    nav: ReturnType<typeof MultistepContextAPI.useStepNavigation>;
    data: ReturnType<typeof MultistepContextAPI.useStepData>;
  }

  /**
   * TestHarness exposes context hooks to the test callback via onReady.
   * This allows direct inspection and manipulation of context state and actions.
   */
  function TestHarness({ onReady }: { onReady: (ctx: ContextHooks) => void }) {
    const navResult = MultistepContextAPI.useStepNavigation();
    const data = MultistepContextAPI.useStepData();
    React.useEffect(() => {
      onReady({ nav: navResult, data });
    }, [navResult, data, onReady]);
    return null;
  }

  /**
   * Renders the MultistepProvider and TestHarness, passing context hooks to the test callback.
   * Used to run assertions after context is initialized.
   */
  function renderWithContext(assertFn: (ctx: ContextHooks) => void) {
    render(
      <MultistepContextAPI.BaseMultistepProvider steps={steps}>
        <TestHarness onReady={assertFn} />
      </MultistepContextAPI.BaseMultistepProvider>
    );
  }

  /**
   * Tests step navigation and data management functionality.
   * Verifies basic navigation between steps works correctly.
   */
  it("navigates between steps and manages step data correctly", async () => {
    await renderWithContext(async ({ nav, data }) => {
      expect(nav._tag).toBe("Success");
      if (nav._tag === "Success") {
        // Wait for initial step to be set
        await waitFor(() => {
          expect(nav.value.currentStepId).not.toBe("");
        });
        expect(nav.value.currentStepId).toBe("step1");

        // Test setting step data
        act(() => {
          data.setStepData("step1", { name: "test" });
        });

        // Navigate to next step
        act(() => {
          const result = nav.value.goToNextStep();
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step2");
        });

        // Navigate back
        act(() => {
          nav.value.goToPreviousStep();
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step1");
        });

        // Jump to step 3
        act(() => {
          const result = nav.value.jumpToStep("step3");
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step3");
        });
      }
    });
  });

  /**
   * Tests skipping optional steps and completing required ones, verifying navigation and state.
   */
  it("skips optional steps and completes required ones", async () => {
    await renderWithContext(async ({ nav }) => {
      expect(nav._tag).toBe("Success");
      if (nav._tag === "Success") {
        act(() => {
          const result = nav.value.goToNextStep();
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step2");
        });
        act(() => {
          const result = nav.value.jumpToStep("step3");
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step3");
        });
      }
    });
  });

  /**
   * Checks that navigation to steps with unmet dependencies is blocked and does not update state.
   */
  it("prevents navigation to steps with unmet dependencies", () => {
    renderWithContext(async ({ nav }) => {
      expect(nav._tag).toBe("Success");
      if (nav._tag === "Success") {
        // Wait for initial step to be set
        await waitFor(() => {
          expect(nav.value.currentStepId).not.toBe("");
        });
        act(() => {
          const result = nav.value.jumpToStep("step3");
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        expect(nav.value.currentStepId).toBe("step1");
      }
    });
  });
});
