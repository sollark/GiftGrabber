import { connectToDatabase } from '@/database/connect'
import { Box, Button } from '@mui/material'
import { FC, useRef } from 'react'
import { QRCode as QR } from 'react-qrcode-logo'

const imageUrl = '/public/assets/logo/logo.svg'
// const link = 'your-link' // Define your link

type QRcodeProps = {
  options?: any
  url: string
}

const QRcode: FC<QRcodeProps> = (props: QRcodeProps) => {
  const defaultOptions = {
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
    // qrStyle : 'dots',
  }

  const options = { ...defaultOptions, ...props.options }
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadCode = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas')
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream')
        let downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `your_name.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    }
  }

  const saveQRCodeToDB = async () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas')
      if (canvas) {
        const pngUrl = canvas.toDataURL('image/png')
        const buffer = Buffer.from(pngUrl.split(',')[1], 'base64')

        const db = await connectToDatabase()
        const collection = db.collection('yourCollectionName')

        const result = await collection.insertOne({
          image: {
            data: buffer,
            contentType: 'image/png',
          },
        })

        console.log('Saved to DB', result)
      }
    }
  }

  return (
    <Box ref={qrRef}>
      <QR value={props.url} {...options} />
      {/* <Button onClick={() => downloadCode()}>Download Code</Button> */}
    </Box>
  )
}

export default QRcode
