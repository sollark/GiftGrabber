// Integration tests for MultistepContext navigation and validation logic
// Requires: Jest, @testing-library/react, React 19+
import React from "react";
import { render } from "@testing-library/react";
import { act } from "react";
import {
  MultistepProvider,
  useStepNavigation,
  useStepValidation,
  useStepData,
} from "@/app/contexts/MultistepContext";

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
    nav: ReturnType<typeof useStepNavigation>;
    val: ReturnType<typeof useStepValidation>;
    data: ReturnType<typeof useStepData>;
  }

  function TestHarness({ onReady }: { onReady: (ctx: ContextHooks) => void }) {
    const nav = useStepNavigation();
    const val = useStepValidation();
    const data = useStepData();
    React.useEffect(() => {
      if (
        typeof nav.currentStepId === "string" &&
        typeof nav.currentStepIndex === "number" &&
        nav.currentStep &&
        typeof nav.currentStep === "object"
      ) {
        onReady({ nav, val, data });
      }
    }, [nav, val, data, onReady]);
    return null;
  }

  function renderWithContext(assertFn: (ctx: ContextHooks) => void) {
    render(
      <MultistepProvider steps={steps}>
        <TestHarness onReady={assertFn} />
      </MultistepProvider>
    );
  }

  it("navigates between steps correctly", () => {
    renderWithContext(({ nav }) => {
      expect(nav.currentStepId).toBe("step1");
      act(() => nav.goToNextStep());
      expect(nav.currentStepId).toBe("step2");
      act(() => nav.goToPreviousStep());
      expect(nav.currentStepId).toBe("step1");
      act(() => nav.jumpToStep("step3"));
      expect(nav.currentStepId).toBe("step3");
    });
  });

  it("validates steps and blocks navigation on error", () => {
    renderWithContext(({ nav, val, data }) => {
      act(() => val.validateStep("step1"));
      expect(val.getStepValidation("step1").isValid).toBe(false);
      act(() => nav.goToNextStep());
      expect(nav.currentStepId).toBe("step1");
      act(() => {
        data.setStepData("step1", "valid");
        val.validateStep("step1");
      });
      expect(val.getStepValidation("step1").isValid).toBe(true);
      act(() => nav.goToNextStep());
      expect(nav.currentStepId).toBe("step2");
    });
  });

  it("skips optional steps and completes required ones", () => {
    renderWithContext(({ nav }) => {
      act(() => nav.goToNextStep());
      expect(nav.currentStepId).toBe("step2");
      act(() => nav.jumpToStep("step3"));
      expect(nav.currentStepId).toBe("step3");
    });
  });

  it("prevents navigation to steps with unmet dependencies", () => {
    renderWithContext(({ nav }) => {
      act(() => nav.jumpToStep("step3"));
      expect(nav.currentStepId).toBe("step1");
    });
  });
});
