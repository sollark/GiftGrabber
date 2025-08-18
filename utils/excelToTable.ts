import * as XLSX from "xlsx";
import parse from "html-react-parser";
import { ReactNode } from "react";
import { parseExcelFile } from "./excel_utils";
import { ExcelImportConfig, ExcelFormatType } from "@/types/excel.types";

/**
 * Configuration constants for the Excel to Table conversion
 */
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

// ============================================================================
// ENHANCED EXCEL TO TABLE - Format-aware processing
// ============================================================================

/**
 * Enhanced Excel to table conversion with format detection and type awareness.
 * Uses the advanced parseExcelFile function for better format support.
 *
 * @param file - The Excel file to convert
 * @param config - Optional configuration for processing
 * @returns Promise<ExcelTableResult> - Enhanced table result with format information
 */
export async function excelToTableEnhanced(
  file: File,
  config?: Partial<ExcelImportConfig>
): Promise<ExcelTableResult> {
  try {
    const result = await parseExcelFile(file, {
      language: "auto",
      skipEmptyRows: true,
      validateRequired: false,
      ...config,
    });

    // Convert structured data to HTML table
    const tableHTML = generateEnhancedTableHTML(result.data, result.formatType);
    const tableElement = extractTableFromHTML(tableHTML);

    if (!tableElement) {
      return {
        success: false,
        error: ERROR_MESSAGES.NO_TABLE_FOUND,
        formatType: result.formatType,
        detectedLanguage: result.language,
      };
    }

    return {
      success: true,
      table: convertToReactTable(tableElement),
      formatType: result.formatType,
      detectedLanguage: result.language,
    };
  } catch (error) {
    console.error("Enhanced Excel to table conversion failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generates HTML table from structured Excel data with format awareness
 */
function generateEnhancedTableHTML(
  data: any[],
  formatType: ExcelFormatType
): string {
  if (data.length === 0) return "<table></table>";

  // Get headers based on format type
  const headers = Object.keys(data[0]);

  const headerRow = headers.map((header) => `<th>${header}</th>`).join("");
  const dataRows = data
    .map((row) => {
      const cells = headers
        .map((header) => `<td>${row[header] || ""}</td>`)
        .join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table>`;
}

// ============================================================================
// LEGACY EXCEL TO TABLE - Backward compatibility
// ============================================================================

/**
 * Legacy Excel to table conversion (kept for backward compatibility)
 * @param file - The Excel file to convert
 * @returns Promise<ReactNode> - The React table component or undefined on error
 */
export async function excelToTable(file: File): Promise<ReactNode> {
  try {
    const workbook = await processExcelFile(file);
    const html = generateTableHTML(workbook);
    const tableElement = extractTableFromHTML(html);

    if (!tableElement) {
      console.error(ERROR_MESSAGES.NO_TABLE_FOUND);
      return undefined;
    }

    return convertToReactTable(tableElement);
  } catch (error) {
    console.error(ERROR_MESSAGES.PROCESSING_ERROR, error);
    return undefined;
  }
}

/**
 * Processes the Excel file and returns a workbook object
 * @param file - The Excel file to process
 * @returns XLSX.WorkBook - The processed workbook
 */
const processExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
  const arrayBuffer = await file.arrayBuffer();
  return XLSX.read(arrayBuffer);
};

/**
 * Generates HTML table from the workbook
 * @param workbook - The Excel workbook
 * @returns string - HTML representation of the table
 */
const generateTableHTML = (workbook: XLSX.WorkBook): string => {
  const worksheet = getFirstWorksheet(workbook);
  return XLSX.utils.sheet_to_html(worksheet);
};

/**
 * Gets the first worksheet from the workbook
 * @param workbook - The Excel workbook
 * @returns XLSX.WorkSheet - The first worksheet
 */
const getFirstWorksheet = (workbook: XLSX.WorkBook): XLSX.WorkSheet => {
  const sheetName = workbook.SheetNames[EXCEL_CONFIG.DEFAULT_SHEET_INDEX];
  return workbook.Sheets[sheetName];
};

/**
 * Extracts table element from HTML string
 * @param html - HTML string containing the table
 * @returns HTMLTableElement | null - The extracted table element
 */
const extractTableFromHTML = (html: string): HTMLTableElement | null => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, EXCEL_CONFIG.MIME_TYPE);
  return doc.querySelector("table");
};

/**
 * Converts HTML table element to React component
 * @param tableElement - The HTML table element
 * @returns ReactNode - The React table component
 */
const convertToReactTable = (tableElement: HTMLTableElement): ReactNode => {
  const tableHtml = tableElement.outerHTML || EXCEL_CONFIG.FALLBACK_HTML;
  return parse(tableHtml);
};

/**
 * Example usage of the excelToTable function:
 *
 * ```typescript
 * import { useState, ReactNode } from 'react';
 * import { excelToTable } from '@/utils/excelToTable';
 *
 * const MyComponent = () => {
 *   const [table, setTable] = useState<ReactNode>();
 *
 *   const handleFileUpload = async (eventFile: File) => {
 *     const reactTable = await excelToTable(eventFile);
 *     setTable(reactTable);
 *   };
 *
 *   return <div>{table}</div>;
 * };
 * ```
 */
