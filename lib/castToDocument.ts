/**
 * Functional utilities for working with Mongoose models and documents.
 * - castToDocument: hydrates a plain object to a Mongoose document.
 * - saveObject: hydrates and saves a plain object as a document, returning the saved document.
 *
 * Usage:
 *   const orderDoc = castToDocument(order, OrderModel);
 *   await orderDoc.save();
 *
 *   // Or, save directly from an object:
 *   const savedOrder = await saveObject(order, OrderModel);
 */

import { Model, Document, HydratedDocument } from "mongoose";

/**
 * Casts an object to a Mongoose document using the provided model.
 * Returns a HydratedDocument with all document methods available.
 *
 * @param obj - The object to cast (plain or hydrated)
 * @param model - The Mongoose model to use for casting
 */
export function castToDocument<T extends Document>(
  obj: Partial<T>,
  model: Model<T>
): HydratedDocument<T> {
  // If already a document, return as is
  if (obj instanceof model) {
    return obj as HydratedDocument<T>;
  }
  // Otherwise, hydrate the object
  return model.hydrate(obj);
}

/**
 * Hydrates and saves a plain object as a Mongoose document.
 * Returns the saved document.
 *
 * @param obj - The object to save
 * @param model - The Mongoose model to use for saving
 */
export async function saveObject<T extends Document>(
  obj: Partial<T>,
  model: Model<T>
): Promise<HydratedDocument<T>> {
  const doc = castToDocument(obj, model);
  await doc.save();
  return doc;
}
