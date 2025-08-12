/**
 * Integration tests for MultistepContext navigation and validation logic
 *
 * These tests verify the correct behavior of the multistep form context, including:
 * - Step navigation (next, previous, jump)
 * - Validation logic and blocking navigation on errors
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
    validationRules: [
      {
        id: "required",
        message: "Step 1 is required",
        validator: (data: unknown) => Boolean(data),
      },
    ],
  },
  {
    id: "step2",
    title: "Step 2",
    isOptional: true,
    validationRules: [
      {
        id: "minLength",
        message: "Step 2 must be at least 3 chars",
        validator: (data: unknown) =>
          typeof data === "string" && data.length >= 3,
      },
    ],
    dependencies: ["step1"],
  },
  {
    id: "step3",
    title: "Step 3",
    validationRules: [],
    dependencies: ["step2"],
  },
];

describe("MultistepContext integration", () => {
  // Helper test harness to run hooks and trigger assertions after context is ready
  interface ContextHooks {
    nav: ReturnType<typeof MultistepContextAPI.useStepNavigation>;
    val: ReturnType<typeof MultistepContextAPI.useStepValidation>;
    data: ReturnType<typeof MultistepContextAPI.useStepData>;
  }

  /**
   * TestHarness exposes context hooks to the test callback via onReady.
   * This allows direct inspection and manipulation of context state and actions.
   */
  function TestHarness({ onReady }: { onReady: (ctx: ContextHooks) => void }) {
    const navResult = MultistepContextAPI.useStepNavigation();
    const val = MultistepContextAPI.useStepValidation();
    const data = MultistepContextAPI.useStepData();
    React.useEffect(() => {
      onReady({ nav: navResult, val, data });
    }, [navResult, val, data, onReady]);
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
   * Verifies that navigation actions (next, previous, jump) update the current step as expected.
   * Uses waitFor to ensure state updates are reflected before assertions.
   */
  it("navigates between steps correctly", async () => {
    await renderWithContext(async ({ nav }) => {
      expect(nav._tag).toBe("Success");
      if (nav._tag === "Success") {
        // Wait for initial step to be set
        await waitFor(() => {
          expect(nav.value.currentStepId).not.toBe("");
        });
        expect(nav.value.currentStepId).toBe("step1");
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
          nav.value.goToPreviousStep();
        });
        await waitFor(() => {
          expect(nav.value.currentStepId).toBe("step1");
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
   * Ensures that validation errors block navigation, and that fixing errors allows navigation.
   * Triggers validation, checks for errors, updates data, and verifies navigation proceeds.
   */
  it("validates steps and blocks navigation on error", async () => {
    await renderWithContext(async ({ nav, val, data }) => {
      expect(nav._tag).toBe("Success");
      if (nav._tag === "Success") {
        act(() => val.validateStep("step1"));
        await waitFor(() => {
          const validationResult1 = val.getStepValidation("step1");
          expect(validationResult1).not.toBeNull();
          if (validationResult1) {
            expect(validationResult1.isValid).toBe(false);
          }
        });
        act(() => {
          const result = nav.value.goToNextStep();
          if (result._tag === "Success") {
            // Navigation succeeded
          } else {
            // Navigation failed
          }
        });
        expect(nav.value.currentStepId).toBe("step1");
        act(() => {
          data.setStepData("step1", "valid");
          val.validateStep("step1");
        });
        await waitFor(() => {
          const validationResult2 = val.getStepValidation("step1");
          expect(validationResult2).not.toBeNull();
          if (validationResult2) {
            expect(validationResult2.isValid).toBe(true);
          }
        });
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
