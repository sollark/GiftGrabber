"use client";
/**
 * CreateEventForm.tsx
 *
 * Purpose: Comprehensive form component for event creation with Excel import, QR generation, and email integration.
 *
 * Main Responsibilities:
 * - Orchestrates the entire event creation workflow, from user input to backend persistence.
 * - Manages Excel file uploads for applicant data import and validation.
 * - Generates QR codes for event access and owner verification.
 * - Validates form data and processes multi-format Excel imports.
 * - Coordinates email delivery with QR codes and event details.
 * - Manages complex form state, error handling, and validation steps.
 *
 * Architecture Role:
 * - Central UI component integrating business logic, context providers, and backend services.
 * - Bridge between file processing utilities, QR code generation, and database/email services.
 * - Critical entry point for event organizer onboarding and event creation.
 *
 * Business Logic Rules:
 * - Generates unique event and owner IDs for security and identification.
 * - Processes Excel files with automatic format detection and validation.
 * - Creates QR codes linking to event pages and owner verification.
 * - Sends confirmation emails with embedded QR codes for offline access.
 * - Validates all input data before database operations.
 *
 * Constraints:
 * - No new UI elements or styling changes.
 * - No new features; only code quality, structure, and maintainability improvements.
 */

import { createEvent } from "@/app/actions/event.action";
import { generateEventId, generateOwnerId } from "@/utils/utils";
import { EventSchema } from "@/utils/validator";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useMemo, FC } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import { useErrorHandler } from "@/components/ErrorBoundary";
import Form from "@/ui/form/Form";
import FormInputSection from "./FormInputSection";
import FormFileSection from "./FormFileSection";
import QRCodeSection from "./QRCodeSection";
import { excelFileToPersonListSafe } from "@/utils/excel_utils";
import { generateQRCodes } from "@/utils/qrcodeUtils";
import { success, isFailure } from "@/utils/fp";
import {
  FORM_CONFIG,
  BASE_URL,
  ERROR_MESSAGES,
} from "@/config/eventFormConfig";
import { sendMailToClient } from "@/service/mailService";
import { useEventContext } from "@/app/contexts/EventContext";
import { useApplicantContext } from "@/app/contexts/ApplicantContext";
import { withPerformance } from "@/hooks/usePerformanceOptimization";
import logger from "@/lib/logger";

/**
 * Error state structure for consolidated error management
 */
interface ErrorState {
  general: string;
  fileProcessing: string[];
}

/**
 * Main CreateEventForm component.
 * Public API.
 * Renders the event creation form, handles submission, and coordinates all event creation logic.
 *
 * Side effects:
 * - Navigates using Next.js router
 * - Updates React state
 * - Triggers backend calls and email delivery
 * - Logs to console
 */

const CreateEventForm: FC = () => {
  // Test the important method with debug info
  logger.log("CreateEventForm Component Rendered");

  // --- Enhanced Error Tracking ---
  const { handleError, errorCount, lastError, clearErrors } =
    useErrorHandler("CreateEventForm");

  // --- State and Contexts ---
  const router = useRouter();
  const eventContext = useEventContext();
  const applicantContext = useApplicantContext();

  // --- Consolidated Error State ---
  const [errors, setErrors] = useState<ErrorState>({
    general: "",
    fileProcessing: [],
  });

  // --- IDs and URLs ---
  const eventId = useMemo(generateEventId, []);
  const ownerId = useMemo(generateOwnerId, []);
  const urls = useMemo(
    () => ({
      EVENT_URL: `${BASE_URL}/${eventId}`,
      OWNER_URL: `${BASE_URL}/${eventId}/${ownerId}`,
    }),
    [eventId, ownerId]
  );

  // --- QR Code Refs ---
  /**
   * Ref for the event QR code element (for image capture).
   * Used to generate and capture QR code images for event access.
   */
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  /**
   * Ref for the owner QR code element (for image capture).
   * Used to generate and capture QR code images for owner verification.
   */
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // --- Helper Functions ---

  /**
   * Aggregates all error messages for display.
   *
   * @returns {string} Combined error message string or empty string if no errors
   * @sideEffects None
   * @notes Ensures user sees all relevant errors at once
   */
  const getAggregatedErrorMessage = useCallback((): string => {
    const allErrors = [
      ...(errors.general ? [errors.general] : []),
      ...errors.fileProcessing,
    ];
    return allErrors.join("; ");
  }, [errors]);

  /**
   * Clears all error states.
   *
   * @sideEffects Updates error state
   * @notes Centralized error clearing for workflow restarts
   */
  const clearAllErrors = useCallback(() => {
    setErrors({ general: "", fileProcessing: [] });
  }, []);

  // --- File Processing Error Handlers ---

  /**
   * Handles file processing errors by aggregating them for display.
   *
   * @param {string} error Error message from file format detection
   * @sideEffects Updates fileProcessing errors in state
   * @notes Ensures all file errors are tracked
   */
  const handleFileError = useCallback((error: string) => {
    setErrors((prev) => ({
      ...prev,
      fileProcessing: [...prev.fileProcessing, error],
    }));
  }, []);

  /**
   * Handles successful file processing by clearing related errors.
   *
   * @param {any} _formatInfo Successfully detected format information (unused)
   * @sideEffects Updates fileProcessing errors in state
   * @notes Resets error state after successful file handling
   */
  const handleFileSuccess = useCallback((_formatInfo: any) => {
    setErrors((prev) => ({ ...prev, fileProcessing: [] }));
  }, []);

  // --- Core Processing Functions ---

  /**
   * Parses Excel applicants file and extracts person data using optimized direct integration.
   *
   * @param {File} file The Excel file containing applicant data
   * @returns {Promise<Result<NewPerson[], string>>} Success with person array or failure with error message
   * @sideEffects Calls Excel processing utilities directly for optimal performance
   * @notes Uses Result pattern for consistent error handling and direct integration eliminates service layer overhead
   */
  const parseApplicantsFile = useCallback(
    (file: File) => excelFileToPersonListSafe(file),
    []
  );

  /**
   * Generates QR codes from DOM refs with consistent Result pattern.
   *
   * @returns {Promise<Result<GenerateQRCodesOutput, string>>} Success with QR code data or failure with error
   * @sideEffects Calls QR code utility, accesses DOM elements
   * @notes Ensures QR codes are generated before event creation
   */
  const generateAndValidateQRCodes = useCallback(
    () => generateQRCodes(eventQRCodeRef, ownerQRCodeRef),
    [eventQRCodeRef, ownerQRCodeRef]
  );

  /**
   * Saves processed event data to application contexts.
   *
   * @param {Object} eventData The validated event data
   * @param {string} eventData.name Event name from form
   * @param {string} eventData.email Organizer email from form
   * @param {any[]} eventData.applicantList Array of parsed applicant data
   * @returns {Promise<Result<void, string>>} Success when data is saved, failure on error
   * @sideEffects Updates EventContext with event details and ApplicantContext with applicant list
   * @notes Actually saves ALL user data - event details AND applicant list to contexts
   */
  const saveToContexts = useCallback(
    async (eventData: {
      name: string;
      email: string;
      applicantList: any[];
    }): Promise<import("@/utils/fp").Result<void, string>> => {
      // Save complete event details (name, email, eventId) to EventContext
      eventContext.dispatch({
        type: "SET_EVENT_DETAILS",
        payload: {
          name: eventData.name,
          email: eventData.email,
          eventId: eventId,
        },
      });

      // Save applicant list to ApplicantContext
      applicantContext.dispatch({
        type: "SET_EVENT_APPLICANTS",
        payload: {
          applicantList: eventData.applicantList,
        },
      });

      return success(undefined);
    },
    [eventId, eventContext, applicantContext]
  );

  // --- Main Form Submission Handler ---

  /**
   * Handles form submission and orchestrates the event creation workflow.
   *
   * @param {Object} data Form data from user input
   * @param {string} data.eventName Event name from form
   * @param {string} data.eventEmail Organizer email from form
   * @param {File} data.applicantsFile Excel file with applicant data
   * @returns {Promise<void>} Resolves when workflow completes or fails
   * @sideEffects Updates error state, triggers backend calls, email services, navigates on success
   * @notes Implements stepwise workflow with Result pattern for error handling
   */
  const handleSubmit = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
    }) => {
      clearAllErrors();

      // Step 1: Parse applicants file
      const applicantsResult = await parseApplicantsFile(data.applicantsFile);
      if (isFailure(applicantsResult)) {
        setErrors((prev) => ({ ...prev, general: applicantsResult.error }));
        return;
      }
      const applicantList = applicantsResult.value;

      // Step 2: Generate QR codes
      const qrResult = await generateAndValidateQRCodes();
      if (isFailure(qrResult)) {
        setErrors((prev) => ({ ...prev, general: qrResult.error }));
        return;
      }
      const qrCodes = qrResult.value;

      // Step 3: Save to contexts
      const eventData = {
        name: data.eventName,
        email: data.eventEmail,
        applicantList,
      };
      const contextResult = await saveToContexts(eventData);
      if (isFailure(contextResult)) {
        setErrors((prev) => ({ ...prev, general: contextResult.error }));
        return;
      }

      // Step 4: Send confirmation email
      const mailResult = await sendMailToClient(
        data.eventEmail,
        qrCodes.eventQRCodeBase64,
        qrCodes.ownerIdQRCodeBase64
      );
      if (isFailure(mailResult)) {
        setErrors((prev) => ({ ...prev, general: mailResult.error }));
        return;
      }

      // Step 5: Create event in database
      const successResult = await createEvent({
        name: data.eventName,
        email: data.eventEmail,
        eventId,
        ownerId,
        eventQRCodeBase64: qrCodes.eventQRCodeBase64,
        ownerIdQRCodeBase64: qrCodes.ownerIdQRCodeBase64,
        applicantList,
      });

      if (successResult) {
        router.push(`/events/${eventId}/${ownerId}`);
      } else {
        setErrors((prev) => ({
          ...prev,
          general: ERROR_MESSAGES.EVENT_CREATION_ERROR,
        }));
      }
    },
    [
      clearAllErrors,
      parseApplicantsFile,
      generateAndValidateQRCodes,
      saveToContexts,
      eventId,
      ownerId,
      router,
    ]
  );

  // --- Render ---
  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={FORM_CONFIG.DEFAULT_VALUES}
        submit={handleSubmit}
      >
        <FormInputSection />
        <FormFileSection
          onFormatError={handleFileError}
          onFormatSuccess={handleFileSuccess}
        />
        <ErrorMessage message={getAggregatedErrorMessage()} />
        {errorCount > 1 && (
          <div
            style={{ fontSize: "0.8em", color: "#666", marginTop: "0.5rem" }}
          >
            Total errors in this session: {errorCount}
          </div>
        )}
      </Form>
      <QRCodeSection
        eventQRCodeRef={eventQRCodeRef}
        ownerQRCodeRef={ownerQRCodeRef}
        eventUrl={urls.EVENT_URL}
        ownerUrl={urls.OWNER_URL}
      />
    </>
  );
};

// Apply performance optimization with memoization
export default withPerformance(CreateEventForm);
