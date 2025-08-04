import * as XLSX from "xlsx";

/**
 * Configuration constants for Excel to JSON conversion
 */
const EXCEL_JSON_CONFIG = {
  WORKBOOK_TYPE: "array" as const,
  HEADER_ROW_INDEX: 1,
  DEFAULT_SHEET_INDEX: 0,
} as const;

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

/**
 * Converts an Excel file to an array of JSON objects
 * @param excelFile - The Excel file to convert
 * @returns Promise<Record<string, string>[]> - Array of objects with string key-value pairs
 * @throws Error if conversion fails
 */
export const convertExcelToJson = async (
  excelFile: File
): Promise<JsonRecord[]> => {
  try {
    const workbook = await processExcelFile(excelFile);
    const worksheet = getFirstWorksheet(workbook);
    const jsonData = convertSheetToJsonData(worksheet);

    return processJsonData(jsonData);
  } catch (error) {
    console.error(ERROR_MESSAGES.CONVERSION_ERROR, error);
    throw error;
  }
};

/**
 * Processes the Excel file and returns a workbook object
 * @param excelFile - The Excel file to process
 * @returns Promise<XLSX.WorkBook> - The processed workbook
 */
const processExcelFile = async (excelFile: File): Promise<XLSX.WorkBook> => {
  const arrayBuffer = await excelFile.arrayBuffer();
  return XLSX.read(arrayBuffer, { type: EXCEL_JSON_CONFIG.WORKBOOK_TYPE });
};

/**
 * Gets the first worksheet from the workbook
 * @param workbook - The Excel workbook
 * @returns XLSX.WorkSheet - The first worksheet
 */
const getFirstWorksheet = (workbook: XLSX.WorkBook): XLSX.WorkSheet => {
  const sheetName = workbook.SheetNames[EXCEL_JSON_CONFIG.DEFAULT_SHEET_INDEX];
  return workbook.Sheets[sheetName];
};

/**
 * Converts a worksheet to JSON data format
 * @param worksheet - The Excel worksheet
 * @returns ExcelData - Array of arrays representing the sheet data
 */
const convertSheetToJsonData = (worksheet: XLSX.WorkSheet): ExcelData => {
  return XLSX.utils.sheet_to_json(worksheet, {
    header: EXCEL_JSON_CONFIG.HEADER_ROW_INDEX,
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
  return jsonData[EXCEL_JSON_CONFIG.DEFAULT_SHEET_INDEX];
};

/**
 * Gets data rows excluding the header row
 * @param jsonData - Raw JSON data
 * @returns ExcelData - Data rows without header
 */
const getDataRowsWithoutHeader = (jsonData: ExcelData): ExcelData => {
  return jsonData.slice(EXCEL_JSON_CONFIG.HEADER_ROW_INDEX);
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
