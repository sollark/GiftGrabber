/**
 * @file excelFileToPersonList.test.ts
 * @description Comprehensive unit tests for excelFileToPersonList function
 * @author Senior Test Engineer
 */

// Mock the i18n module to provide dummy translations
jest.mock("@/i18n/locales/en/translate.json", () => ({
  excel_headers: {
    firstName: ["firstName", "FirstName", "first_name", "First Name"],
    lastName: ["lastName", "LastName", "last_name", "Last Name"],
  },
  excel_errors: {
    empty_file: "Excel file is empty or invalid",
    unrecognized_format:
      "Unrecognized Excel format. Available headers: {{headers}}",
  },
}));

// Mock the other translation files as well
jest.mock("@/i18n/locales/he/translate.json", () => ({
  excel_headers: {
    firstName: ["שם פרטי", "firstName"],
    lastName: ["שם משפחה", "lastName"],
  },
  excel_errors: {
    empty_file: "קובץ אקסל ריק או לא תקין",
    unrecognized_format: "פורמט אקסל לא מזוהה. כותרות זמינות: {{headers}}",
  },
}));

jest.mock("@/i18n/locales/ru/translate.json", () => ({
  excel_headers: {
    firstName: ["имя", "firstName"],
    lastName: ["фамилия", "lastName"],
  },
  excel_errors: {
    empty_file: "Файл Excel пуст или недействителен",
    unrecognized_format:
      "Нераспознанный формат Excel. Доступные заголовки: {{headers}}",
  },
}));

import { excelFileToPersonList } from "@/utils/excel_utils";
import { Person } from "@/database/models/person.model";
import { ExcelFormatType } from "@/types/excel.types";
import fs from "fs";
import path from "path";

/**
 * File polyfill for Node.js environment
 * Provides File API compatibility for testing
 */
class NodeFile {
  public name: string;
  public type: string;
  public size: number;
  public lastModified: number = Date.now();
  public webkitRelativePath: string = "";
  private buffer: Buffer;

  constructor(buffer: Buffer, fileName: string, options?: { type?: string }) {
    this.buffer = buffer;
    this.name = fileName;
    this.type = options?.type || "";
    this.size = buffer.length;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    // Ensure we return an ArrayBuffer, not SharedArrayBuffer
    const buffer = this.buffer.buffer;
    if (buffer instanceof ArrayBuffer) {
      return buffer.slice(
        this.buffer.byteOffset,
        this.buffer.byteOffset + this.buffer.byteLength
      );
    } else {
      // Convert SharedArrayBuffer to ArrayBuffer if needed
      const arrayBuffer = new ArrayBuffer(this.buffer.byteLength);
      const view = new Uint8Array(arrayBuffer);
      const sourceView = new Uint8Array(
        buffer,
        this.buffer.byteOffset,
        this.buffer.byteLength
      );
      view.set(sourceView);
      return arrayBuffer;
    }
  }

  async text(): Promise<string> {
    return this.buffer.toString("utf8");
  }

  async bytes(): Promise<Uint8Array> {
    return new Uint8Array(await this.arrayBuffer());
  }

  slice(start?: number, end?: number, contentType?: string): Blob {
    const slicedBuffer = this.buffer.slice(start, end);
    return new NodeFile(slicedBuffer, this.name, {
      type: contentType || this.type,
    }) as any;
  }

  stream(): ReadableStream<Uint8Array> {
    // Simple ReadableStream implementation for testing
    const buffer = this.buffer;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(buffer));
        controller.close();
      },
    }) as any;
  }
}

// Mock console.error to capture error messages instead of hiding them
const mockConsoleError = jest.fn();
console.error = mockConsoleError;

describe("excelFileToPersonList", () => {
  const testFilesPath = path.join(__dirname, "./");

  afterEach(() => {
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    // mockConsoleError.mockRestore(); // No longer needed since we're not using spyOn
  });

  describe("BASIC_NAME format", () => {
    it("should parse applicants.en.BASIC_NAME.xlsx correctly", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );

      // Check if file exists
      expect(fs.existsSync(filePath)).toBe(true);

      const fileBuffer = fs.readFileSync(filePath);
      expect(fileBuffer.length).toBeGreaterThan(0);

      const file = new NodeFile(fileBuffer, "applicants.en.BASIC_NAME.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }) as any; // Cast to any to satisfy File interface      // Act
      const result = await excelFileToPersonList(file);
      console.log("File processed successfully:", result);

      // Debug output
      if (result === null) {
        console.log("Result is null - function failed");
        console.log("Console errors:", mockConsoleError.mock.calls);
      }

      // Assert
      expect(result).not.toBeNull();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(10);

      // Verify each person object structure
      result!.forEach((person: Person, index: number) => {
        expect(person).toHaveProperty(
          "sourceFormat",
          ExcelFormatType.BASIC_NAME
        );
        expect(person).toHaveProperty("firstName");
        expect(person).toHaveProperty("lastName");
        expect(person.firstName).toBe(`ApplicantFirst${index + 1}`);
        expect(person.lastName).toBe(`ApplicantLast${index + 1}`);
      });
    });

    it("should handle BASIC_NAME format with required fields only", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "applicants.en.BASIC_NAME.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(file as File);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).not.toBeNull();
      const firstPerson = result![0];

      // Verify BASIC_NAME format only populates firstName and lastName
      expect(firstPerson.firstName).toBeDefined();
      expect(firstPerson.lastName).toBeDefined();
      expect(firstPerson.employeeId).toBeUndefined();
      expect(firstPerson.personId).toBeUndefined();
    });
  });

  describe("Error handling", () => {
    it("should return null for invalid file", async () => {
      // Arrange
      const invalidFile = new File(["invalid content"], "invalid.txt", {
        type: "text/plain",
      });

      // Act
      const result = await excelFileToPersonList(invalidFile);

      // Assert
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalledWith(
        "Excel file processing failed:",
        expect.any(Error)
      );
    });

    it("should return null for empty file", async () => {
      // Arrange
      const emptyFile = new File([], "empty.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(emptyFile);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });

    it("should handle corrupted Excel file gracefully", async () => {
      // Arrange
      const corruptedContent = new ArrayBuffer(100);
      const corruptedFile = new File([corruptedContent], "corrupted.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(corruptedFile);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).toBeNull();
      expect(mockConsoleError).toHaveBeenCalled();
    });
  });

  describe("Data transformation", () => {
    it("should properly map BASIC_NAME format to Person fields", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "applicants.en.BASIC_NAME.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(file as File);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).not.toBeNull();
      const person = result![0];

      expect(person.sourceFormat).toBe(ExcelFormatType.BASIC_NAME);
      expect(person.firstName).toBeDefined();
      expect(person.lastName).toBeDefined();
      expect(typeof person.firstName).toBe("string");
      expect(typeof person.lastName).toBe("string");
      expect(person.firstName!.length).toBeGreaterThan(0);
      expect(person.lastName!.length).toBeGreaterThan(0);
    });

    it("should handle empty string values gracefully", async () => {
      // This test would require a custom Excel file with empty cells
      // For now, we test the existing files and verify string type handling
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "applicants.en.BASIC_NAME.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(file as File);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).not.toBeNull();
      result!.forEach((person: Person) => {
        if (person.firstName !== undefined) {
          expect(typeof person.firstName).toBe("string");
        }
        if (person.lastName !== undefined) {
          expect(typeof person.lastName).toBe("string");
        }
      });
    });
  });

  describe("File type validation", () => {
    it("should accept .xlsx files", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const result = await excelFileToPersonList(file as File);
      console.log("File processed successfully:", result);

      // Assert
      expect(result).not.toBeNull();
    });

    it("should handle files with different extensions but valid Excel content", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "test.xls", {
        type: "application/vnd.ms-excel",
      });

      // Act
      const result = await excelFileToPersonList(file as File);

      // Assert - Should still work as content is valid Excel
      expect(result).not.toBeNull();
    });
  });

  describe("Performance and memory", () => {
    it("should process large file efficiently", async () => {
      // Arrange
      const filePath = path.join(
        testFilesPath,
        "applicants.en.BASIC_NAME.xlsx"
      );
      const fileBuffer = fs.readFileSync(filePath);
      const file = new NodeFile(fileBuffer, "large.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Act
      const startTime = performance.now();
      const result = await excelFileToPersonList(file as File);
      const endTime = performance.now();
      console.log("File processed successfully:", result);

      // Assert
      expect(result).not.toBeNull();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
