import QRcode from '@/components/QRcode'
import { useRef } from 'react'

const URL = 'http://gift-grabber.onrender.com/'

export function useQRCode(queryProp: string) {
  const qrRef = useRef<HTMLDivElement>(null)
  const qrCodeNode = QRcode({
    url: `${URL}${queryProp}`,
    qrRef,
  })

  let qrCodeBuffer = ''
  if (qrRef.current) {
    const canvas = qrRef.current.querySelector('canvas')
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png')
      const buffer = Buffer.from(pngUrl.split(',')[1], 'base64')
      qrCodeBuffer = buffer.toString('base64')
    }
  }

  return [qrCodeNode, qrCodeBuffer]
}
