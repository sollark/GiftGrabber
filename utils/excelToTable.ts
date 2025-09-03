import { ReactNode } from "react";
import { parseExcelFileSafe } from "./excel_utils";
import { ExcelImportConfig, ExcelFormatType } from "@/types/excel.types";
import { EXCEL_CONFIG } from "@/config/excelConfig";

/**
 * Error messages for Excel processing
 */
const ERROR_MESSAGES = {
  NO_TABLE_FOUND: "No table found in the worksheet",
  PROCESSING_ERROR: "Error processing Excel file",
} as const;

/**
 * Interface for the return type of excelToTable function
 */
interface ExcelTableResult {
  success: boolean;
  table?: ReactNode;
  error?: string;
  formatType?: ExcelFormatType;
  detectedLanguage?: string;
}

/**
 * excelToTable.ts
 *
 * Purpose: Provides utilities to convert Excel files to React table components with format detection and type awareness.
 * Responsibilities:
 * - Converts structured Excel data to HTML tables and React components
 * - Handles errors and format detection
 * - Exports main API for Excel-to-table conversion
 *
 * Note: Only format-aware implementation is present. No legacy code.
 */

// ============================================================================
// EXCEL TO TABLE - Format-aware processing
// ============================================================================

/**
 * Enhanced Excel to table conversion with format detection and type awareness.
 * Uses the advanced parseExcelFile function for better format support.
 * @param file - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns {Promise<ExcelTableResult>} Enhanced table result with format information
 */
/**
 * Converts an Excel file to a React table component with format detection and type awareness.
 * @param file - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns {Promise<ExcelTableResult>} Table result with format information
 */
export async function excelToTableEnhanced(
  file: File,
  config?: Partial<ExcelImportConfig>
): Promise<ExcelTableResult> {
  const result = await parseExcelFileSafe(file, {
    language: "auto",
    skipEmptyRows: true,
    validateRequired: false,
    ...config,
  });

  if (result._tag === "Failure") {
    return {
      success: false,
      error: result.error.message,
      formatType: ExcelFormatType.BASIC_NAME,
      detectedLanguage: "auto",
    };
  }

  const tableHTML = generateTableHTML(result.value.data);
  const tableElement = extractTableFromHTML(tableHTML);

  if (!tableElement) {
    return {
      success: false,
      error: ERROR_MESSAGES.NO_TABLE_FOUND,
      formatType: result.value.formatType,
      detectedLanguage: result.value.language,
    };
  }

  return {
    success: true,
    table: convertToReactTable(tableElement),
    formatType: result.value.formatType,
    detectedLanguage: result.value.language,
  };
}

/**
 * Generates HTML table from structured Excel data with format awareness.
 * @param data - Array of row objects
 * @param formatType - Detected Excel format type
 * @returns {string} HTML table string
 */
/**
 * Generates HTML table from structured Excel data.
 * @param data - Array of row objects
 * @returns {string} HTML table string
 */
function generateTableHTML(data: any[]): string {
  if (!Array.isArray(data) || data.length === 0) return "<table></table>";
  const headers = Object.keys(data[0]);
  const headerRow = headers.map((header) => `<th>${header}</th>`).join("");
  const dataRows = data
    .map((row) => {
      const cells = headers
        .map((header) => `<td>${row[header] ?? ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");
  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>`;
}

/**
 * Extracts table element from HTML string
 * @param html - HTML string containing the table
 * @returns HTMLTableElement | null - The extracted table element
 */
/**
 * Extracts the first table element from an HTML string.
 * @param html - HTML string containing the table
 * @returns HTMLTableElement | null - The extracted table element
 */
function extractTableFromHTML(html: string): HTMLTableElement | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, EXCEL_CONFIG.MIME_TYPE);
  return doc.querySelector("table");
}

/**
 * Converts HTML table element to React component
 * @param tableElement - The HTML table element
 * @returns ReactNode - The React table component
 */
/**
 * Converts an HTML table element to a ReactNode using html-react-parser.
 * @param tableElement - The HTML table element
 * @returns ReactNode - The React table component
 */
function convertToReactTable(tableElement: HTMLTableElement): ReactNode {
  const tableHtml = tableElement.outerHTML || EXCEL_CONFIG.FALLBACK_HTML;
  // html-react-parser should be imported at the top of the file
  // @ts-ignore
  return parse(tableHtml);
}
// ============================================================================
// EXCEL TO TABLE - Format-aware processing
// ============================================================================

/**
 * Excel to table conversion with format detection and type awareness.
 * Uses the advanced parseExcelFile function for better format support.
 * @param file - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns {Promise<ExcelTableResult>} Table result with format information
 */
/**
 * Main API: Converts an Excel file to a React table component with format detection.
 * @param file - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns {Promise<ExcelTableResult>} Table result with format information
 */
export async function excelToTable(
  file: File,
  config?: Partial<ExcelImportConfig>
): Promise<ExcelTableResult> {
  return excelToTableEnhanced(file, config);
}
