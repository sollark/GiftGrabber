import type { NextApiRequest, NextApiResponse } from 'next'
import { sendEmail } from '../../../lib/email'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    await sendEmail({
      to: 'sollark@gmail.com',
      subject: 'Welcome to NextAPI',
      html: '',
      text: 'Hello mathafaka',
    })

    return NextResponse.json(
      { message: 'Email sent successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}
