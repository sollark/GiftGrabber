/**
 * excel.types.ts
 *
 * Purpose: Type definitions for Excel file import/export functionality with i18n support
 *
 * Main Responsibilities:
 * - Defines standardized Excel format types for various employee data structures
 * - Provides type-safe interfaces for different Excel import formats (complete, basic, ID-only)
 * - Establishes format detection and validation result types
 * - Supports multi-language Excel files through i18n integration
 * - Enables batch processing of Excel data with confidence scoring
 *
 * Architecture Role:
 * - Bridge between raw Excel data and application Person models
 * - Used by Excel parsing utilities, import services, and validation systems
 * - Supports format auto-detection with confidence metrics
 * - Enables type-safe transformation of Excel rows to Person entities
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
 * Runtime type guard for complete employee Excel format validation
 *
 * @param data - Raw Excel import data to validate against CompleteEmployeeFormat schema
 * @returns Boolean indicating if data contains all required complete employee fields
 *
 * @sideEffects None - pure function with no state mutations
 * @performance O(1) - validates presence of 4 required fields
 * @notes Essential for format detection during Excel import process
 * @publicAPI Used by Excel parsing utilities and validation pipelines
 */
export function isCompleteEmployeeFormat(
  data: ExcelImportFormat
): data is CompleteEmployeeFormat {
  const emp = data as CompleteEmployeeFormat;
  return !!(emp.id && emp.firstName && emp.lastName && emp.employee_number);
}

/**
 * Runtime type guard for basic name Excel format validation
 *
 * @param data - Raw Excel import data to validate against BasicNameFormat schema
 * @returns Boolean indicating if data contains required first and last name fields
 *
 * @sideEffects None - pure function with no state mutations
 * @performance O(1) - validates presence of 2 required fields
 * @notes Used for simple name-only Excel imports without employee data
 * @publicAPI Used by Excel parsing utilities and validation pipelines
 */
export function isBasicNameFormat(
  data: ExcelImportFormat
): data is BasicNameFormat {
  const basic = data as BasicNameFormat;
  return !!(basic.firstName && basic.lastName);
}

/**
 * Runtime type guard for worker ID-only Excel format validation
 *
 * @param data - Raw Excel import data to validate against WorkerIdOnlyFormat schema
 * @returns Boolean indicating if data contains required worker_id field
 *
 * @sideEffects None - pure function with no state mutations
 * @performance O(1) - validates presence of single required field
 * @notes Used for importing worker identification lists without personal details
 * @publicAPI Used by Excel parsing utilities and validation pipelines
 */
export function isWorkerIdOnlyFormat(
  data: ExcelImportFormat
): data is WorkerIdOnlyFormat {
  const worker = data as WorkerIdOnlyFormat;
  return !!worker.worker_id;
}

/**
 * Runtime type guard for person ID-only Excel format validation
 *
 * @param data - Raw Excel import data to validate against PersonIdOnlyFormat schema
 * @returns Boolean indicating if data contains required person_id_number field
 *
 * @sideEffects None - pure function with no state mutations
 * @performance O(1) - validates presence of single required field
 * @notes Used for importing citizen identification lists without personal details
 * @publicAPI Used by Excel parsing utilities and validation pipelines
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
