import nodemailer from 'nodemailer'

type EmailPayload = {
  to: string
  subject: string
  html: string
  text: string
}

const smtpOptions = {
  service: 'Yahoo',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

export const sendEmail = async (data: EmailPayload) => {
  console.log('Sending email ...')

  const transporter = nodemailer.createTransport({
    ...smtpOptions,
  })

  return await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL,
    ...data,
  })
}
