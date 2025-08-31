import { Types } from "mongoose";
import OrderModel from "../database/models/order.model";
import GiftModel from "../database/models/gift.model";
import PersonModel from "../database/models/person.model";

import { connectToDatabase } from "../database/connect";
import { makeOrder, confirmOrder, getOrder } from "../app/actions/order.action";

describe("Order Confirmation Integration", () => {
  // Increase timeout for slow DB operations
  jest.setTimeout(30000);
  let applicant: any;
  let approver: any;
  let gifts: any[];
  let orderId: string;
  let confirmationRQCode: string;

  beforeAll(async () => {
    // Ensure DB connection is established before running tests
    await connectToDatabase();

    // Create test applicant and approver with proper schema (publicId auto-generated)
    applicant = await PersonModel.create({
      firstName: "Test",
      lastName: "Applicant",
      sourceFormat: "basic_name", // Use valid enum value
    });
    approver = await PersonModel.create({
      firstName: "Test",
      lastName: "Approver",
      sourceFormat: "basic_name", // Use valid enum value
    });

    // Create test gifts with proper owner references
    gifts = [
      await GiftModel.create({ owner: applicant._id }),
      await GiftModel.create({ owner: applicant._id }),
    ];

    orderId = new Types.ObjectId().toHexString();
    confirmationRQCode = "test-code";
  });

  afterAll(async () => {
    await OrderModel.deleteMany({});
    await GiftModel.deleteMany({});
    await PersonModel.deleteMany({});
  });

  it("should create and confirm an order, updating gifts", async () => {
    // Create order using publicIds - now returns order's publicId
    const orderPublicId = await makeOrder(
      applicant.publicId, // Use publicId instead of _id
      gifts.map((gift) => gift.publicId), // Use publicIds for gifts
      orderId,
      confirmationRQCode
    );
    expect(orderPublicId).toBeTruthy(); // Should return publicId string
    expect(typeof orderPublicId).toBe("string");

    // Confirm order using publicIds
    const confirmedOrder = await confirmOrder(
      orderPublicId!,
      approver.publicId
    ); // Use publicId instead of _id
    expect(confirmedOrder).toBeTruthy();
    if (confirmedOrder === false) {
      throw new Error("Order confirmation failed");
    }
    const confirmed = confirmedOrder as { publicId: string; status: string }; // Use publicId instead of _id
    expect(confirmed.status).toBe("COMPLETED");
    expect(confirmed.publicId).toBe(orderPublicId); // Verify same order

    // Check gifts updated (optimized batch query - Issue D Fix)
    const { findGiftsByPublicIds } = await import(
      "../database/optimizedQueries"
    );
    const giftPublicIds = gifts.map((gift) => gift.publicId);
    const updatedGiftsResult = await findGiftsByPublicIds(giftPublicIds);

    if (updatedGiftsResult._tag === "Failure") {
      throw new Error("Failed to fetch updated gifts");
    }

    const updatedGifts = updatedGiftsResult.value;
    expect(updatedGifts.length).toBe(gifts.length);

    // Note: For populated queries, we need to use the original query temporarily
    // TODO: Extend optimized queries to support population with order details
    const populatedGifts = await GiftModel.find({
      publicId: { $in: giftPublicIds },
    })
      .populate("order")
      .lean()
      .exec();

    populatedGifts.forEach((gift: any) => {
      expect(gift.applicant?.toString()).toBe(applicant._id.toString()); // Internal DB relationship still uses _id
      expect(gift.order?.publicId).toBe(confirmed.publicId); // But external access uses publicId
    });
  });

  it("should retrieve the confirmed order", async () => {
    // Create an order and get its publicId
    const orderPublicId = await makeOrder(
      applicant.publicId,
      gifts.map((gift) => gift.publicId),
      orderId,
      confirmationRQCode
    );
    expect(orderPublicId).toBeTruthy();

    // Now retrieve order using its publicId (correct PublicId strategy)
    const order = await getOrder(orderPublicId!);
    expect(order).toBeTruthy();
    expect(order && order.orderId).toBe(orderId); // Business field should match
    expect(order && order.publicId).toBe(orderPublicId); // PublicId should match
  });
});
