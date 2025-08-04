"use client";

import { MultistepContext } from "@/app/contexts/MultistepContext";
import { OrderContext } from "@/app/contexts/OrderContext";
import { useSafeContext } from "@/app/hooks/useSafeContext";
import { OrderStatus } from "@/components/types/OrderStatus";
import { Person } from "@/database/models/person.model";
import { FC, useLayoutEffect } from "react";
import ConditionalRender from "./ConditionalRender";
import PersonAutocomplete from "./form/PersonAutocomplete";

const Approver: FC = () => {
  const { order, approverList, setApprover } = useSafeContext(OrderContext);
  const { goToNextStep, goTo } = useSafeContext(MultistepContext);

  useLayoutEffect(() => {
    if (order.status === OrderStatus.COMPLETE) {
      goTo(1);
    }
  }, [order.status, goTo]);

  const handleApproverSelection = (selectedPerson: Person) => {
    if (!selectedPerson) return;

    setApprover(selectedPerson);
    goToNextStep();
  };

  const handlePersonChange = () => {
    // No-op for this component
  };

  const isOrderIncomplete = order.status !== OrderStatus.COMPLETE;

  return (
    <div>
      <ConditionalRender condition={isOrderIncomplete}>
        <PersonAutocomplete
          peopleList={approverList}
          onSelectPerson={handleApproverSelection}
          onChangePerson={handlePersonChange}
        />
      </ConditionalRender>
    </div>
  );
};

export default Approver;
