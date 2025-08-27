import { sendMailToClient, sendMail } from "../service/mailService";
import { EMAIL_CONFIG } from "../config/emailConfig";
import { Result } from "../utils/fp";

// Mock dependencies
jest.mock("../app/actions/email.action", () => ({
  sendQRCodesToOwner: jest.fn(),
}));

const mockSendQRCodesToOwner =
  require("../app/actions/email.action").sendQRCodesToOwner;

describe("mailService", () => {
  const email = "test@example.com";
  const eventQRCodeBase64 = "eventQR==";
  const ownerQRCodeBase64 = "ownerQR==";

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendMailToClient", () => {
    it("should return Success when sendMail succeeds", async () => {
      mockSendQRCodesToOwner.mockResolvedValueOnce(undefined);
      const result = await sendMailToClient(
        email,
        eventQRCodeBase64,
        ownerQRCodeBase64
      );
      expect(result._tag).toBe("Success");
    });

    it("should return Failure when sendMail fails", async () => {
      mockSendQRCodesToOwner.mockImplementationOnce(() => {
        throw new Error("fail");
      });
      const result = await sendMailToClient(
        email,
        eventQRCodeBase64,
        ownerQRCodeBase64
      );
      expect(result._tag).toBe("Failure");
      // Use type guard before accessing error
      if (result._tag === "Failure") {
        expect(result.error).toBeDefined();
      }
    });
  });
  // No direct tests for sendMail; all scenarios are covered via sendMailToClient
});
