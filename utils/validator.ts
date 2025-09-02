import { z } from "zod";

/**
 * Main validation schema for event creation form
 * Validates event name, email, and file uploads
 */
export const EventSchema = z.object({
  eventName: z
    .string()
    .trim()
    .min(1, { message: "Field can not be empty" })
    .min(3, { message: "Event name must be at least 3 characters" })
    .max(20, { message: "Event name must be less than 20 characters" })
    .regex(/^[a-zA-Z0-9 .\/-]*$/, {
      message: "Event name must be alphanumeric",
    }),
  eventEmail: z
    .string()
    .trim()
    .min(1, { message: "Field can not be empty" })
    .max(24, { message: "Email must be less than 24 characters" })
    .email({ message: "Invalid email address" }),
  applicantsFile: z.instanceof(File).refine(
    (file) => {
      const ext = file.name.split(".").pop();
      return ext === "xls" || ext === "xlsx";
    },
    {
      message: "File type must be .xls or .xlsx",
    }
  ),
});
