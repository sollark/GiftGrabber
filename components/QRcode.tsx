import { Box } from '@mui/material'
import { FC, useRef } from 'react'
import { QRCode as QR } from 'react-qrcode-logo'

const imageUrl = '/public/assets/logo/logo.svg'

type EyeColor = string | InnerOuterEyeColor
type InnerOuterEyeColor = {
  inner: string
  outer: string
}
type CornerRadii = number | [number, number, number, number] | InnerOuterRadii
type InnerOuterRadii = {
  inner: number | [number, number, number, number]
  outer: number | [number, number, number, number]
}
type QRcodeOptions = {
  value?: string
  ecLevel?: 'L' | 'M' | 'Q' | 'H'
  enableCORS?: boolean
  size?: number
  quietZone?: number
  bgColor?: string
  fgColor?: string
  logoImage?: string
  logoWidth?: number
  logoHeight?: number
  logoOpacity?: number
  logoOnLoad?: () => void
  removeQrCodeBehindLogo?: boolean
  logoPadding?: number
  logoPaddingStyle?: 'square' | 'circle'
  eyeRadius?: CornerRadii | [CornerRadii, CornerRadii, CornerRadii]
  eyeColor?: EyeColor | [EyeColor, EyeColor, EyeColor]
  qrStyle?: 'squares' | 'dots'
  style?: object
  id?: string
}
type QRcodeProps = {
  url: string
  qrRef: React.RefObject<HTMLDivElement>
  options?: QRcodeOptions
}

const QRcode: FC<QRcodeProps> = (props: QRcodeProps) => {
  const defaultOptions: QRcodeOptions = {
    ecLevel: 'M',
    enableCORS: false,
    size: 250,
    quietZone: 10,
    bgColor: '#FFFFFF',
    fgColor: '#000000',
    logoImage: imageUrl,
    logoWidth: 40,
    logoHeight: 40,
    logoOpacity: 1,
    eyeRadius: 10,
    qrStyle: 'squares',
  }

  const options = { ...defaultOptions, ...props.options }

  return (
    <Box ref={props.qrRef}>
      <QR value={props.url} {...options} />
    </Box>
  )
}

export default QRcode

// Usage
// const downloadCode = () => {
//   if (qrRef.current) {
//     const canvas = qrRef.current.querySelector('canvas')
//     if (canvas) {
//       const pngUrl = canvas
//         .toDataURL('image/png')
//         .replace('image/png', 'image/octet-stream')
//       let downloadLink = document.createElement('a')
//       downloadLink.href = pngUrl
//       downloadLink.download = `your_name.png`
//       document.body.appendChild(downloadLink)
//       downloadLink.click()
//       document.body.removeChild(downloadLink)
//     }
//   }
// }

// const getQRcodeBuffer = async (qrRef) => {
//   if (qrRef.current) {
//     const canvas = qrRef.current.querySelector('canvas')
//     if (canvas) {
//       const pngUrl = canvas.toDataURL('image/png')
//       const buffer = Buffer.from(pngUrl.split(',')[1], 'base64')
//     }
//   }
// }

// create image from buffer
// const fs = require('fs')
// const buffer = //...
// fs.writeFileSync('image.png', buffer)
