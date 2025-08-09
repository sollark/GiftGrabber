import QRcode from "../QRcode";

export interface QRCodeSectionProps {
  eventQRCodeRef: React.RefObject<HTMLDivElement>;
  ownerQRCodeRef: React.RefObject<HTMLDivElement>;
  eventUrl: string;
  ownerUrl: string;
}

/**
 * Component for rendering QR code elements
 */
const QRCodeSection = ({
  eventQRCodeRef,
  ownerQRCodeRef,
  eventUrl,
  ownerUrl,
}: QRCodeSectionProps) => (
  <>
    <QRcode url={eventUrl} qrRef={eventQRCodeRef} />
    <QRcode url={ownerUrl} qrRef={ownerQRCodeRef} />
  </>
);

export default QRCodeSection;
