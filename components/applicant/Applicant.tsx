"use client";

/**
 * Applicant.tsx
 *
 * This file defines the Applicant component, which manages applicant selection and gift assignment in the Gift Grabber app.
 *
 * Responsibilities:
 * - Display an autocomplete for selecting an applicant
 * - Handle applicant selection and update context
 * - Assign gifts to the selected applicant if available
 * - Advance to the next step in the flow
 *
 * Constraints:
 * - No styling or UI changes
 * - No new features or business logic
 * - Only code quality, structure, and documentation improvements
 */

import React, { FC, useCallback } from "react";
import {
  useApplicantList,
  useApplicantActions,
  useSelectedApplicant,
} from "@/app/contexts/ApplicantContext";
import { useStepNavigationActions } from "@/app/contexts/multistep/useStepNavigationActions";
import { Person } from "@/database/models/person.model";
import PersonAutocomplete from "../PersonAutocomplete";

/**
 * Applicant
 * Handles applicant selection, gift assignment, and step navigation.
 * Uses context for applicant, gift, and navigation state.
 * @returns The applicant selection UI
 */
const Applicant: FC = () => {
  const applicantList = useApplicantList();
  const applicantActions = useApplicantActions();
  const selectedApplicant = useSelectedApplicant();
  const { goToNextStep } = useStepNavigationActions();

  /**
   * processApplicantSelection
   * Handles the full applicant selection process: updates state, assigns gift, and advances step.
   * @param person - The selected applicant
   */
  const processApplicantSelection = useCallback(
    (person: Person) => {
      if (applicantActions._tag === "Some") {
        applicantActions.value.dispatchSafe({
          type: "SELECT_APPLICANT",
          payload: person,
        });
      }
      goToNextStep();
    },
    [goToNextStep]
  );

  /**
   * handleApplicantSelection
   * Handles the selection of an applicant from the autocomplete.
   * @param person - The selected person
   */
  const handleApplicantSelection = useCallback(
    (person: Person) => {
      if (!person) return;
      processApplicantSelection(person);
    },
    [processApplicantSelection]
  );

  return (
    <PersonAutocomplete
      peopleList={applicantList._tag === "Some" ? applicantList.value : []}
      onSelectPerson={handleApplicantSelection}
      value={selectedApplicant._tag === "Some" ? selectedApplicant.value : null}
    />
  );
};

export default Applicant;
