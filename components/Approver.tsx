"use client";

import { useStepNavigationActions } from "@/app/contexts/MultiStep/useStepNavigationActions";
import { useOrderStatus } from "@/app/contexts/OrderContext";
import { OrderStatus } from "@/components/types/OrderStatus";
import { Person } from "@/database/models/person.model";
import React, { FC, useLayoutEffect } from "react";
import ConditionalRender from "./ConditionalRender";
import PersonAutocomplete from "./form/PersonAutocomplete";
import { useApproverSelection } from "@/app/contexts/ApproverContext";

const Approver: FC = () => {
  const { order } = useOrderStatus();
  const { approverList, selectApprover } = useApproverSelection();
  const { goToNextStep, jumpToStep } = useStepNavigationActions();

  useLayoutEffect(() => {
    const orderValue = order._tag === "Some" ? order.value : null;
    if (orderValue && orderValue.status === "completed") {
      jumpToStep("step-1"); // Assuming step IDs, adjust as needed
    }
  }, [order, jumpToStep]);

  const handleApproverSelection = (selectedPerson: Person) => {
    if (!selectedPerson) return;

    selectApprover(selectedPerson);
    goToNextStep();
  };

  const handlePersonChange = () => {
    // No-op for this component
  };

  const orderValue = order._tag === "Some" ? order.value : null;
  const isOrderIncomplete = !orderValue || orderValue.status !== "completed";

  return (
    <div>
      <ConditionalRender condition={isOrderIncomplete}>
        <PersonAutocomplete
          peopleList={approverList._tag === "Some" ? approverList.value : []}
          onSelectPerson={handleApproverSelection}
          onChangePerson={handlePersonChange}
        />
      </ConditionalRender>
    </div>
  );
};

export default Approver;
