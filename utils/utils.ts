import { customAlphabet } from "nanoid";
import { convertExcelToJson } from "./excelToJson";
import { excelToTable } from "./excelToTable";
import { tryAsync } from "./fp";

/**
 * Converts a File to a base64 string using functional error handling.
 * Returns a Promise<Result<string, Error>>.
 * Pure function: no side effects outside of FileReader API.
 */
export const convertFileToBase64 = tryAsync<[File], string>(async function (
  file: File
): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("FileReader result is not a string"));
      }
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("Unknown FileReader error"));
    };
    reader.readAsDataURL(file);
  });
});

/**
 * Generates a unique event ID using a custom alphabet.
 * Pure function.
 */
export function generateEventId(): string {
  const nanoid = customAlphabet("1234567890event", 10);
  return nanoid();
}

/**
 * Generates a unique owner ID using a custom alphabet.
 * Pure function.
 */
export function generateOwnerId(): string {
  const nanoid = customAlphabet("1234567890owner", 5);
  return nanoid();
}

/**
 * Generates a unique order ID using a custom alphabet.
 * Pure function.
 */
export function generateOrderId(): string {
  const nanoid = customAlphabet("1234567890order", 15);
  return nanoid();
}

/**
 * Extracts a QR code buffer from a React ref to a QR code element.
 * Returns a Buffer or undefined.
 * Impure: depends on DOM and React ref.
 */
export const getQRcodeBuffer = async (qrRef: any) => {
  if (qrRef.current) {
    const canvas = qrRef.current.querySelector("canvas");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const buffer = Buffer.from(pngUrl.split(",")[1], "base64");
      return buffer;
    }
  }
};

// ============================================================================
// EXCEL PROCESSING UTILITIES - Re-exports for convenience
// ============================================================================

/**
 * Re-export Excel processing utilities for easy access
 */
export { convertExcelToJson, excelToTable };

// ============================================================================
// OBJECT COMPARISON UTILITIES
// ============================================================================

/**
 * Generic deep equality comparison for any type.
 * Handles primitives, objects, arrays, dates, null/undefined.
 * @param a - First value to compare
 * @param b - Second value to compare
 * @returns boolean - True if values are deeply equal
 */
export function deepEqual<T>(a: T, b: T): boolean {
  if (a === b) return true;

  // Handle null and undefined
  if (a == null || b == null) return a === b;

  // Handle Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Handle Array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((val, i) => deepEqual(val, b[i]));
  }

  // Handle Object
  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as object);
    const keysB = Object.keys(b as object);

    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => deepEqual((a as any)[key], (b as any)[key]));
  }

  // Fallback (numbers, strings, booleans, etc.)
  return a === b;
}
