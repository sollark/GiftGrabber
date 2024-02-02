import { z } from 'zod'

export const EventSchema = z.object({
  eventName: z
    .string()
    .trim()
    .min(1, { message: 'Field can not be empty' })
    .min(2, { message: 'Event name must be at least 3 characters' })
    .max(20, { message: 'Event name must be less than 20 characters' })
    .regex(/^[a-zA-Z0-9]*$/, { message: 'Event name must be alphanumeric' }),
  eventEmail: z
    .string()
    .trim()
    .min(1, { message: 'Field can not be empty' })
    .max(24, { message: 'Email must be less than 24 characters' })
    .email({ message: 'Invalid email address' }),
  eventFile: z.object({
    name: z.string(),
    size: z.number().max(10 * 1024 * 1024, {
      message: 'File size must be under 10 MB',
    }),
    type: z
      .string()
      .regex(
        /^application\/(vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)$/,
        {
          message: 'File type must be .xls or .xlsx',
        }
      ),
  }),
  base64File: z.string(),
})
