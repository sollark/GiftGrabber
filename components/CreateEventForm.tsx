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
import { useRef, useState } from "react";
import QRcode from "./QRcode";
import ControlledFileInput from "./form/ControlledFileInput";
import ControlledTextInput from "./form/ControlledTextInput";
import ErrorMessage from "./form/ErrorMessage";
import Form from "./form/Form";

const FORM_DEFAULT_VALUES = {
  eventName: "",
  eventEmail: "",
  applicantsFile: undefined,
  approversFile: undefined,
};

const BASE_URL = "https://gift-grabber.onrender.com/events";
const EVENT_ID = generateEventId();
const OWNER_ID = generateOwnerId();
const EVENT_URL = `${BASE_URL}/${EVENT_ID}`;
const OWNER_URL = `${BASE_URL}/${EVENT_ID}/${OWNER_ID}`;

const INPUT_STYLES = { style: { fontSize: 24 } };

const CreateEventForm = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const eventQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;
  const ownerQRCodeRef = useRef<HTMLDivElement>(
    null
  ) as React.RefObject<HTMLDivElement>;

  const processFormData = async (data: any) => {
    const {
      eventName: name,
      eventEmail: email,
      applicantsFile,
      approversFile,
    } = data;

    const applicantList = await excelToPersonList(applicantsFile);
    if (!applicantList) {
      setErrorMessage("Error getting an applicant list");
      return null;
    }

    const approverList = await excelToPersonList(approversFile);
    if (!approverList) {
      setErrorMessage("Error getting an approvers list");
      return null;
    }

    return { name, email, applicantList, approverList };
  };

  const generateQRCodes = async () => {
    const eventQRCodeBuffer = await getQRcodeBuffer(eventQRCodeRef);
    const ownerIdQRCodeBuffer = await getQRcodeBuffer(ownerQRCodeRef);

    if (!eventQRCodeBuffer || !ownerIdQRCodeBuffer) {
      setErrorMessage("Error getting QR code");
      return null;
    }

    return {
      eventQRCodeBase64: eventQRCodeBuffer.toString("base64"),
      ownerIdQRCodeBase64: ownerIdQRCodeBuffer.toString("base64"),
    };
  };

  const createEmailAttachments = (
    eventQRCodeBase64: string,
    ownerIdQRCodeBase64: string
  ) => [
    {
      filename: "event QR code.png",
      content: eventQRCodeBase64,
      encoding: "base64" as const,
    },
    {
      filename: "owner QR code.png",
      content: ownerIdQRCodeBase64,
      encoding: "base64" as const,
    },
  ];

  const handleSubmit = async (data: any) => {
    console.log("Submitting...");

    const processedData = await processFormData(data);
    if (!processedData) return;

    const qrCodes = await generateQRCodes();
    if (!qrCodes) return;

    const { name, email, applicantList, approverList } = processedData;
    const { eventQRCodeBase64, ownerIdQRCodeBase64 } = qrCodes;

    const emailResponse = await sendQRCodesToOwner({
      to: email,
      html: `<html><h1>QR codes</h1></html>`,
      attachments: createEmailAttachments(
        eventQRCodeBase64,
        ownerIdQRCodeBase64
      ),
    });

    const response = await createEvent({
      name,
      email,
      eventId: EVENT_ID,
      ownerId: OWNER_ID,
      eventQRCodeBase64,
      ownerIdQRCodeBase64,
      applicantList,
      approverList,
    });

    if (response) {
      router.push(`/events/${EVENT_ID}/${OWNER_ID}`);
    } else {
      console.log("Error creating event");
    }
  };

  return (
    <>
      <Form
        schema={EventSchema}
        defaultValues={FORM_DEFAULT_VALUES}
        submit={handleSubmit}
      >
        <div>
          <ControlledTextInput
            name="eventName"
            label="Event name"
            type="text"
            variant="outlined"
            inputProps={INPUT_STYLES}
          />
          <ControlledTextInput
            name="eventEmail"
            label="Event email"
            type="email"
            variant="outlined"
            inputProps={INPUT_STYLES}
          />
        </div>
        <div>
          <ControlledFileInput
            name="applicantsFile"
            label="List of applicants"
            type="file"
            variant="outlined"
            inputProps={INPUT_STYLES}
          />
          <ControlledFileInput
            name="approversFile"
            label="List of approvers"
            type="file"
            variant="outlined"
            inputProps={INPUT_STYLES}
          />
        </div>
        <ErrorMessage message={errorMessage} />
      </Form>
      <QRcode url={EVENT_URL} qrRef={eventQRCodeRef} />
      <QRcode url={OWNER_URL} qrRef={ownerQRCodeRef} />
    </>
  );
};

export default CreateEventForm;
