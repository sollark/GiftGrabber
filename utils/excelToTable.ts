import * as XLSX from "xlsx";
import parse, { HTMLReactParserOptions } from "html-react-parser";
import { ReactNode } from "react";

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
}

/**
 * Converts an Excel file to a React table component
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
