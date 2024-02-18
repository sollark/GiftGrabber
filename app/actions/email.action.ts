'use server'

import { sendEmail } from '../../lib/email'

type EmailPayload = {
  to: string
  html: string
  attachments: Array<any>
}

export const sendQRCodesToOwner = async (data: EmailPayload) => {
  console.log(`Sending email to ${data.to} ...`)

  try {
    await sendEmail({
      to: data.to,
      subject: 'Welcome to NextAPI',
      html: data.html,
      attachments: data.attachments,
    })

    console.log('Email sent successfully')
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
