"use client";

import { createEvent } from "@/app/actions/event.action";
import { generateEventId, generateOwnerId } from "@/utils/utils";
import { EventSchema } from "@/utils/validator";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback, useMemo, FC } from "react";
import ErrorMessage from "../../ui/form/ErrorMessage";
import Form from "../../ui/form/Form";
import { useApplicantSelection } from "@/app/contexts/ApplicantContext";
import { useApproverSelection } from "@/app/contexts/ApproverContext";
import FormInputSection from "./FormInputSection";
import FormFileSection from "./FormFileSection";
import QRCodeSection from "./QRCodeSection";
import {
  processFormData,
  generateQRCodes,
  createEmailAttachments,
  PersonWithoutId,
} from "@/service/createEventFormService";
import {
  FORM_CONFIG,
  BASE_URL,
  ERROR_MESSAGES,
  EMAIL_CONFIG,
} from "@/components/event/createEventFormConfig";
import { sendMail } from "@/service/mailService";

/**
 * Main CreateEventForm component
 */
const CreateEventForm: FC = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Generate unique IDs for this component instance
  const eventId = useMemo(generateEventId, []);
  const ownerId = useMemo(generateOwnerId, []);

  // Memoize URLs based on generated IDs
  const urls = useMemo(
    () => ({
      EVENT_URL: `${BASE_URL}/${eventId}`,
      OWNER_URL: `${BASE_URL}/${eventId}/${ownerId}`,
    }),
    [eventId, ownerId]
  );

  // Initialize QR code refs for capturing QR code elements
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Main form submission handler
  const handleSubmit = useCallback(
    async (data: {
      eventName: string;
      eventEmail: string;
      applicantsFile: File;
      approversFile: File;
    }) => {
      console.log("Submitting...");

      const processedResult = await processFormData(data, ERROR_MESSAGES);
      if (processedResult._tag === "Failure") {
        setErrorMessage(processedResult.error);
        return;
      }
      const processedData = processedResult.value;

      const qrResult = await generateQRCodes(
        eventQRCodeRef,
        ownerQRCodeRef,
        ERROR_MESSAGES
      );
      if (qrResult._tag === "Failure") {
        setErrorMessage(qrResult.error);
        return;
      }
      const qrCodes = qrResult.value;

      const mailResult = await sendMail({
        to: processedData.email,
        html: EMAIL_CONFIG.HTML_CONTENT,
        attachments: createEmailAttachments(
          qrCodes.eventQRCodeBase64,
          qrCodes.ownerIdQRCodeBase64,
          EMAIL_CONFIG.ATTACHMENTS
        ),
      });
      if (mailResult._tag === "Failure") {
        setErrorMessage(mailResult.error);
        return;
      }

      const success = await createEvent({
        name: processedData.name,
        email: processedData.email,
        eventId,
        ownerId,
        eventQRCodeBase64: qrCodes.eventQRCodeBase64,
        ownerIdQRCodeBase64: qrCodes.ownerIdQRCodeBase64,
        applicantList: processedData.applicantList,
        approverList: processedData.approverList,
      });

      if (success) {
        router.push(`/events/${eventId}/${ownerId}`);
      } else {
        setErrorMessage(ERROR_MESSAGES.EVENT_CREATION_ERROR);
      }
    },
    [eventId, ownerId, router]
  );

  const { applicantList: contextApplicantList } = useApplicantSelection();
  const { approverList: contextApproverList } = useApproverSelection();

  // Prefer context values if available, else fallback to empty array
  const applicants: PersonWithoutId[] =
    contextApplicantList &&
    contextApplicantList._tag === "Some" &&
    Array.isArray(contextApplicantList.value)
      ? contextApplicantList.value
      : [];

  const approvers: PersonWithoutId[] =
    contextApproverList &&
    contextApproverList._tag === "Some" &&
    Array.isArray(contextApproverList.value)
      ? contextApproverList.value
      : [];

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={FORM_CONFIG.DEFAULT_VALUES}
        submit={handleSubmit}
      >
        <FormInputSection />
        <FormFileSection />
        <ErrorMessage message={errorMessage} />
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

export default CreateEventForm;
