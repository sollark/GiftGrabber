import { Box, Button } from '@mui/material'
import { FC } from 'react'
import { QRCode as QR } from 'react-qrcode-logo'

const imageUrl = '/public/assets/logo/logo.svg'
// const link = 'your-link' // Define your link

type QRcodeProps = {
  options: any
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

  const downloadCode = () => {
    const canvas: any = document.getElementById('sameId_as_QRCode_compoent_id')
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

  return (
    <Box>
      <QR value={props.url} {...options} />
      <Button onClick={() => downloadCode()}>Download Code</Button>
    </Box>
  )
}

export default QRcode
