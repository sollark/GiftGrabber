import { Types } from "mongoose";
import OrderModel from "../database/models/order.model";
import GiftModel from "../database/models/gift.model";
import PersonModel from "../database/models/person.model";
import { makeOrder, confirmOrder, getOrder } from "../app/actions/order.action";

describe("Order Confirmation Integration", () => {
  let applicant: any;
  let approver: any;
  let gifts: any[];
  let orderId: string;
  let confirmationRQCode: string;

  beforeAll(async () => {
    // Create test applicant and approver
    applicant = await PersonModel.create({
      firstName: "Test",
      lastName: "Applicant",
    });
    approver = await PersonModel.create({
      firstName: "Test",
      lastName: "Approver",
    });

    // Create test gifts
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
    // Create order
    const orderCreated = await makeOrder(
      [approver],
      applicant,
      gifts,
      orderId,
      confirmationRQCode
    );
    expect(orderCreated).toBe(true);

    // Confirm order
    const confirmedOrder = await confirmOrder(orderId, approver._id);
    expect(confirmedOrder).toBeTruthy();
    if (confirmedOrder === false) {
      throw new Error("Order confirmation failed");
    }
    const confirmed = confirmedOrder as { _id: Types.ObjectId; status: string };
    // Now you can safely access confirmed._id and confirmed.status
    expect(confirmed.status).toBe("COMPLETE");

    // Check gifts updated
    const updatedGifts = await GiftModel.find({ order: confirmed._id });
    expect(updatedGifts.length).toBe(gifts.length);
    updatedGifts.forEach((gift: any) => {
      expect(gift.receiver?.toString()).toBe(applicant._id.toString());
      expect(gift.order?.toString()).toBe(confirmed._id.toString());
    });
  });

  it("should retrieve the confirmed order", async () => {
    const order = await getOrder(orderId);
    expect(order).toBeTruthy();
    expect(order && order.status).toBe("COMPLETE");
  });
});
