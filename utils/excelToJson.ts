// EXCEL_JSON_CONFIG removed; use EXCEL_CONFIG from config/excelConfig.ts

/**
 * Configuration constants for Excel to JSON conversion
 */
import { EXCEL_CONFIG } from "@/config/excelConfig";
import { parseExcelFileSafe } from "./excel_utils";
import {
  ExcelImportFormat,
  ExcelFormatType,
  ExcelImportConfig,
} from "@/types/excel.types";
import { Result, success, failure } from "@/utils/fp";

/**
 * Dynamically imports XLSX library only when needed to reduce bundle size.
 * @returns Promise<typeof XLSX> - The XLSX library
 */
const loadXLSX = async (): Promise<typeof import("xlsx")> => {
  return import("xlsx");
};

/**
 * Error messages for Excel JSON processing
 */
const ERROR_MESSAGES = {
  CONVERSION_ERROR: "Error converting Excel file to JSON:",
} as const;

/**
 * Type definitions for better type safety
 */
type ExcelRow = any[];
type ExcelData = ExcelRow[];
type JsonRecord = Record<string, string>;

// ============================================================================
// EXCEL TO JSON CONVERSION - Enhanced with functional error handling
// ============================================================================

// ============================================================================
// LEGACY EXCEL TO JSON - Backward compatibility
// ============================================================================

/**
 * Converts an Excel file to an array of JSON objects with enhanced error handling and format support.
 * @param excelFile - The Excel file to convert
 * @param config - Optional configuration for parsing
 * @returns Promise<Record<string, string>[]> - Array of objects with string key-value pairs
 * @throws Error if conversion fails
 */
export const convertExcelToJson = async (
  excelFile: File,
  config?: Partial<ExcelImportConfig>
): Promise<JsonRecord[]> => {
  const result = await parseExcelFileSafe(excelFile, {
    language: "auto",
    skipEmptyRows: true,
    validateRequired: false,
    ...config,
  });

  if (result._tag === "Failure") {
    throw result.error;
  }

  // Convert advanced format data to simple JSON records
  return result.value.data.map((record: ExcelImportFormat): JsonRecord => {
    const jsonRecord: JsonRecord = {};

    // Convert typed format data to string key-value pairs
    Object.entries(record).forEach(([key, value]) => {
      jsonRecord[key] = String(value || "");
    });

    return jsonRecord;
  });
};

/**
 * Processes the Excel file and returns a workbook object
 * @param excelFile - The Excel file to process
 * @returns Promise<XLSX.WorkBook> - The processed workbook
 */
const processExcelFile = async (
  excelFile: File
): Promise<import("xlsx").WorkBook> => {
  const XLSX = await loadXLSX();
  const arrayBuffer = await excelFile.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: EXCEL_CONFIG.WORKBOOK_TYPE });
};

/**
 * Gets the first worksheet from the workbook
 * @param workbook - The Excel workbook
 * @returns XLSX.WorkSheet - The first worksheet
 */
const getFirstWorksheet = (
  workbook: import("xlsx").WorkBook
): import("xlsx").WorkSheet => {
  const sheetName = workbook.SheetNames[EXCEL_CONFIG.DEFAULT_SHEET_INDEX];
  return workbook.Sheets[sheetName];
};

/**
 * Converts a worksheet to JSON data format
 * @param worksheet - The Excel worksheet
 * @returns ExcelData - Array of arrays representing the sheet data
 */
const convertSheetToJsonData = async (
  worksheet: import("xlsx").WorkSheet
): Promise<ExcelData> => {
  const XLSX = await loadXLSX();
  return XLSX.utils.sheet_to_json(worksheet, {
    header: EXCEL_CONFIG.HEADER_ROW_INDEX,
  }) as ExcelData;
};

/**
 * Processes the raw JSON data into the final format
 * @param jsonData - Raw JSON data from the Excel sheet
 * @returns JsonRecord[] - Processed array of objects
 */
const processJsonData = (jsonData: ExcelData): JsonRecord[] => {
  const headerRow = getHeaderRow(jsonData);
  const dataRows = getDataRowsWithoutHeader(jsonData);

  return dataRows.reduce((result: JsonRecord[], row: ExcelRow) => {
    if (isRowNotEmpty(row)) {
      const recordObject = createRecordFromRow(row, headerRow);
      result.push(recordObject);
    }
    return result;
  }, []);
};

/**
 * Gets the header row from the JSON data
 * @param jsonData - Raw JSON data
 * @returns ExcelRow - The header row
 */
const getHeaderRow = (jsonData: ExcelData): ExcelRow => {
  return jsonData[EXCEL_CONFIG.DEFAULT_SHEET_INDEX];
};

/**
 * Gets data rows excluding the header row
 * @param jsonData - Raw JSON data
 * @returns ExcelData - Data rows without header
 */
const getDataRowsWithoutHeader = (jsonData: ExcelData): ExcelData => {
  return jsonData.slice(EXCEL_CONFIG.HEADER_ROW_INDEX);
};

/**
 * Checks if a row contains any non-empty data
 * @param row - Excel row to check
 * @returns boolean - True if row has data, false if empty
 */
const isRowNotEmpty = (row: ExcelRow): boolean => {
  return row.some((cell) => cell !== null && cell !== undefined && cell !== "");
};

/**
 * Creates a record object from a data row and header row
 * @param row - Data row from Excel
 * @param headerRow - Header row containing column names
 * @returns JsonRecord - Object with header-value mappings
 */
const createRecordFromRow = (
  row: ExcelRow,
  headerRow: ExcelRow
): JsonRecord => {
  const recordObject: JsonRecord = {};

  for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
    const columnName = headerRow[columnIndex];
    const cellValue = row[columnIndex];
    recordObject[columnName] = cellValue;
  }

  return recordObject;
};

// ============================================================================
// RESULT-BASED SAFE WRAPPERS
// ============================================================================

/**
 * Safe wrapper for convertExcelToJson with Result pattern.
 * Provides enhanced Excel to JSON conversion without throwing exceptions.
 *
 * @param excelFile - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns Promise<Result<JsonRecord[], Error>> - Conversion result or error
 */
export const convertExcelToJsonSafe = async (
  excelFile: File,
  config?: Partial<ExcelImportConfig>
): Promise<Result<JsonRecord[], Error>> => {
  try {
    const result = await convertExcelToJson(excelFile, config);
    return success(result);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};
