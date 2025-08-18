/**
 * TypeScript types for Excel import formats and i18n integration
 */

import { Person } from "@/database/models/person.model";

/**
 * Supported Excel format types
 */
export enum ExcelFormatType {
  COMPLETE_EMPLOYEE = "complete_employee",
  BASIC_NAME = "basic_name",
  EMPLOYEE_ID_ONLY = "employee_id_only",
  PERSON_ID_ONLY = "person_id_only",
}

/**
 * Base interface for all Excel person data formats
 */
export interface BaseExcelPersonData extends Partial<Omit<Person, "_id">> {}

/**
 * Complete employee format - includes all employee information
 * Maps to: ID, firstName, lastName, employee_number
 */
export interface CompleteEmployeeFormat extends BaseExcelPersonData {
  id: string;
  firstName: string;
  lastName: string;
  employee_number: string;
}

/**
 * Basic name format - minimal person information
 * Maps to: firstName, lastName
 */
export interface BasicNameFormat extends BaseExcelPersonData {
  firstName: string;
  lastName: string;
}

/**
 * Worker ID only format - for worker identification lists
 * Maps to: worker_id
 */
export interface WorkerIdOnlyFormat extends BaseExcelPersonData {
  worker_id: string;
}

/**
 * Person ID only format - for citizen identification lists
 * Maps to: person_id_number
 */
export interface PersonIdOnlyFormat extends BaseExcelPersonData {
  person_id_number: string;
}

/**
 * Union type for all possible Excel import formats
 */
export type ExcelImportFormat =
  | CompleteEmployeeFormat
  | BasicNameFormat
  | WorkerIdOnlyFormat
  | PersonIdOnlyFormat;

/**
 * Format detection result with confidence scoring
 */
export interface FormatDetectionResult {
  formatType: ExcelFormatType;
  confidence: number; // 0-1 confidence score
  detectedHeaders: string[];
  missingHeaders?: string[];
  language?: string;
}

/**
 * Excel import result containing format and data
 */
export interface ExcelImportResult<
  T extends ExcelImportFormat = ExcelImportFormat
> {
  formatType: ExcelFormatType;
  data: T[];
  totalRecords: number;
  validRecords: number;
  errors?: string[];
  language?: string;
}

/**
 * Configuration for Excel import process
 */
export interface ExcelImportConfig {
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
  validateRequired?: boolean;
  language?: "en" | "he" | "ru" | "auto";
  strictMode?: boolean;
}

/**
 * Header mapping from original to normalized field
 */
export interface HeaderMapping {
  originalHeader: string;
  normalizedField: string;
  language: string;
  confidence: number;
}

/**
 * Supported languages for Excel header translation
 */
export type SupportedLanguage = "en" | "he" | "ru";

/**
 * Translation namespace for Excel headers
 */
export interface ExcelTranslations {
  excel_headers: {
    id: string[];
    worker_id: string[];
    firstName: string[];
    lastName: string[];
    employee_number: string[];
    person_id_number: string[];
  };
  excel_formats: {
    [K in ExcelFormatType]: string;
  };
  excel_errors: {
    empty_file: string;
    unrecognized_format: string;
    missing_required_fields: string;
    processing_error: string;
  };
}

/**
 * Type guard to check if data matches CompleteEmployeeFormat
 */
export function isCompleteEmployeeFormat(
  data: ExcelImportFormat
): data is CompleteEmployeeFormat {
  const emp = data as CompleteEmployeeFormat;
  return !!(emp.id && emp.firstName && emp.lastName && emp.employee_number);
}

/**
 * Type guard to check if data matches BasicNameFormat
 */
export function isBasicNameFormat(
  data: ExcelImportFormat
): data is BasicNameFormat {
  const basic = data as BasicNameFormat;
  return !!(basic.firstName && basic.lastName);
}

/**
 * Type guard to check if data matches WorkerIdOnlyFormat
 */
export function isWorkerIdOnlyFormat(
  data: ExcelImportFormat
): data is WorkerIdOnlyFormat {
  const worker = data as WorkerIdOnlyFormat;
  return !!worker.worker_id;
}

/**
 * Type guard to check if data matches PersonIdOnlyFormat
 */
export function isPersonIdOnlyFormat(
  data: ExcelImportFormat
): data is PersonIdOnlyFormat {
  const person = data as PersonIdOnlyFormat;
  return !!person.person_id_number;
}

// ============================================================================
// LEGACY INTEGRATION TYPES - Compatibility layer
// ============================================================================

/**
 * Simple JSON record type for legacy compatibility
 */
export type JsonRecord = Record<string, string>;

/**
 * Enhanced table result with format information
 */
export interface EnhancedTableResult {
  success: boolean;
  table?: any; // ReactNode
  error?: string;
  formatType?: ExcelFormatType;
  detectedLanguage?: string;
  totalRecords?: number;
  validRecords?: number;
}

/**
 * Legacy Excel processing options
 */
export interface LegacyExcelOptions {
  skipEmptyRows?: boolean;
  trimWhitespace?: boolean;
  enableFormatDetection?: boolean;
  language?: "en" | "he" | "ru" | "auto";
}
