"use client";

import { sendQRCodesToOwner } from "@/app/actions/email.action";
import { createEvent } from "@/app/actions/event.action";
import {
  excelToPersonList,
  generateEventId,
  generateOwnerId,
  getQRcodeBuffer,
} from "@/utils/utils";
import { EventSchema } from "@/utils/validator";
import { useRouter } from "next/navigation";
import { useRef, useState, useCallback } from "react";
import QRcode from "./QRcode";
import ControlledFileInput from "./form/ControlledFileInput";
import ControlledTextInput from "./form/ControlledTextInput";
import ErrorMessage from "./form/ErrorMessage";
import Form from "./form/Form";

/**
 * Configuration constants for the CreateEventForm component
 */
const FORM_CONFIG = {
  DEFAULT_VALUES: {
    eventName: "",
    eventEmail: "",
    applicantsFile: undefined,
    approversFile: undefined,
  },
  INPUT_STYLES: { style: { fontSize: 24 } },
} as const;

/**
 * URL configuration for the event system
 */
const URL_CONFIG = {
  BASE_URL: "https://gift-grabber.onrender.com/events",
  EVENT_ID: generateEventId(),
  OWNER_ID: generateOwnerId(),
} as const;

/**
 * Derived URLs from the base configuration
 */
const URLS = {
  EVENT_URL: `${URL_CONFIG.BASE_URL}/${URL_CONFIG.EVENT_ID}`,
  OWNER_URL: `${URL_CONFIG.BASE_URL}/${URL_CONFIG.EVENT_ID}/${URL_CONFIG.OWNER_ID}`,
} as const;

/**
 * Error messages for form processing
 */
const ERROR_MESSAGES = {
  APPLICANT_LIST_ERROR: "Error getting an applicant list",
  APPROVER_LIST_ERROR: "Error getting an approvers list",
  QR_CODE_ERROR: "Error getting QR code",
  EVENT_CREATION_ERROR: "Error creating event",
} as const;

/**
 * Email configuration constants
 */
const EMAIL_CONFIG = {
  HTML_CONTENT: `<html><h1>QR codes</h1></html>`,
  ATTACHMENTS: {
    EVENT_QR_FILENAME: "event QR code.png",
    OWNER_QR_FILENAME: "owner QR code.png",
    ENCODING: "base64" as const,
  },
} as const;

const CreateEventForm = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize QR code refs for capturing QR code elements
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  // Memoized form data processing function
  const processFormData = useCallback(async (data: any) => {
    const {
      eventName: name,
      eventEmail: email,
      applicantsFile,
      approversFile,
    } = data;

    const applicantList = await excelToPersonList(applicantsFile);
    if (!applicantList) {
      setErrorMessage(ERROR_MESSAGES.APPLICANT_LIST_ERROR);
      return null;
    }

    const approverList = await excelToPersonList(approversFile);
    if (!approverList) {
      setErrorMessage(ERROR_MESSAGES.APPROVER_LIST_ERROR);
      return null;
    }

    return { name, email, applicantList, approverList };
  }, []);

  // Memoized QR code generation function
  const generateQRCodes = useCallback(async () => {
    const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef);
    const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef);

    if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
      setErrorMessage(ERROR_MESSAGES.QR_CODE_ERROR);
      return null;
    }

    return {
      eventQRCodeBase64: eventQRCodeBuffer.toString("base64"),
      ownerIdQRCodeBase64: ownerIdQRCodeBuffer.toString("base64"),
    };
  }, []);

  // Memoized email attachments creation function
  const createEmailAttachments = useCallback(
    (eventQRCodeBase64: string, ownerIdQRCodeBase64: string) => [
      {
        filename: EMAIL_CONFIG.ATTACHMENTS.EVENT_QR_FILENAME,
        content: eventQRCodeBase64,
        encoding: EMAIL_CONFIG.ATTACHMENTS.ENCODING,
      },
      {
        filename: EMAIL_CONFIG.ATTACHMENTS.OWNER_QR_FILENAME,
        content: ownerIdQRCodeBase64,
        encoding: EMAIL_CONFIG.ATTACHMENTS.ENCODING,
      },
    ],
    []
  );

  // Main form submission handler
  const handleSubmit = useCallback(
    async (data: any) => {
      console.log("Submitting...");

      const processedData = await processFormData(data);
      if (!processedData) return;

      const qrCodes = await generateQRCodes();
      if (!qrCodes) return;

      const success = await submitEventData(processedData, qrCodes);
      if (success) {
        router.push(`/events/${URL_CONFIG.EVENT_ID}/${URL_CONFIG.OWNER_ID}`);
      } else {
        console.log(ERROR_MESSAGES.EVENT_CREATION_ERROR);
      }
    },
    [processFormData, generateQRCodes, createEmailAttachments, router]
  );

  // Handle event creation and email sending
  const submitEventData = useCallback(
    async (processedData: any, qrCodes: any) => {
      const { name, email, applicantList, approverList } = processedData;
      const { eventQRCodeBase64, ownerIdQRCodeBase64 } = qrCodes;

      await sendQRCodesToOwner({
        to: email,
        html: EMAIL_CONFIG.HTML_CONTENT,
        attachments: createEmailAttachments(
          eventQRCodeBase64,
          ownerIdQRCodeBase64
        ),
      });

      return await createEvent({
        name,
        email,
        eventId: URL_CONFIG.EVENT_ID,
        ownerId: URL_CONFIG.OWNER_ID,
        eventQRCodeBase64,
        ownerIdQRCodeBase64,
        applicantList,
        approverList,
      });
    },
    [createEmailAttachments]
  );

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
      />
    </>
  );
};

/**
 * Component for rendering text input fields
 */
const FormInputSection = () => (
  <div>
    <ControlledTextInput
      name="eventName"
      label="Event name"
      type="text"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
    <ControlledTextInput
      name="eventEmail"
      label="Event email"
      type="email"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
  </div>
);

/**
 * Component for rendering file input fields
 */
const FormFileSection = () => (
  <div>
    <ControlledFileInput
      name="applicantsFile"
      label="List of applicants"
      type="file"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
    <ControlledFileInput
      name="approversFile"
      label="List of approvers"
      type="file"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
  </div>
);

/**
 * Component for rendering QR code elements
 */
interface QRCodeSectionProps {
  eventQRCodeRef: React.RefObject<HTMLDivElement>;
  ownerQRCodeRef: React.RefObject<HTMLDivElement>;
}

const QRCodeSection = ({
  eventQRCodeRef,
  ownerQRCodeRef,
}: QRCodeSectionProps) => (
  <>
    <QRcode url={URLS.EVENT_URL} qrRef={eventQRCodeRef} />
    <QRcode url={URLS.OWNER_URL} qrRef={ownerQRCodeRef} />
  </>
);

export default CreateEventForm;
