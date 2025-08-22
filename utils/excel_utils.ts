/**
 * excel_utils.ts
 *
 * Purpose: Advanced Excel file processing engine with multi-language support and intelligent format detection
 *
 * Main Responsibilities:
 * - Processes Excel files with automatic format detection across 4 distinct schemas
 * - Implements multi-language header mapping with confidence scoring (English, Hebrew, Russian)
 * - Provides performance-optimized parsing with caching and dynamic imports
 * - Generates localized error messages and validation feedback
 * - Converts Excel data to type-safe Person objects with format preservation
 * - Maintains backward compatibility while supporting new Excel import patterns
 *
 * Architecture Role:
 * - Core data ingestion layer for bulk person import workflows
 * - Bridge between raw Excel data and application Person entities
 * - Foundation for internationalization in Excel processing workflows
 * - Performance-critical component supporting large-scale data imports
 * - Translation management system with dynamic language loading
 *
 * @businessLogic
 * - Supports 4 Excel formats: CompleteEmployee, BasicName, WorkerIdOnly, PersonIdOnly
 * - Automatic language detection through header analysis with confidence scoring
 * - Format detection prioritizes more complete data formats for better accuracy
 * - Caching strategies optimize repeated file processing and translation loading
 * - Error handling provides detailed feedback for data validation and format issues
 *
 * @file excel_utils.ts
 *
 * Purpose: Comprehensive Excel file processing with multi-language support and automatic format detection.
 *
 * Responsibilities:
 * - Parse Excel files with automatic format detection (CompleteEmployee, BasicName, WorkerIdOnly, PersonIdOnly)
 * - Provide multi-language header mapping with confidence scoring (English, Hebrew, Russian)
 * - Implement performance optimizations through caching and dynamic imports
 * - Generate localized error messages based on detected language
 * - Convert Excel data to type-safe formats with validation
 * - Maintain backward compatibility with legacy Person creation workflow
 *
 * Architecture:
 * - Translation Management: Dynamic loading and caching of language files
 * - Format Detection: Pattern-based detection with confidence scoring
 * - Data Processing: Type-safe conversion with validation and error handling
 * - Performance: WeakMap caching for files, Map caching for translations
 * - Error Handling: Localized messages with fallback to English
 *
 * @module excel_utils
 */

import { NewPerson } from "@/types/common.types";
import {
  ExcelFormatType,
  ExcelImportFormat,
  ExcelImportResult,
  ExcelImportConfig,
  FormatDetectionResult,
  HeaderMapping,
  CompleteEmployeeFormat,
  BasicNameFormat,
  WorkerIdOnlyFormat,
  PersonIdOnlyFormat,
  SupportedLanguage,
  ExcelTranslations,
} from "@/types/excel.types";

// ============================================================================
// CONSTANTS AND CONFIGURATION
// ============================================================================

/**
 * Fallback format names in English when translations fail to load.
 * Provides user-friendly display names for each supported Excel format.
 */
const FALLBACK_FORMAT_NAMES = {
  [ExcelFormatType.COMPLETE_EMPLOYEE]: "Complete Employee Data",
  [ExcelFormatType.BASIC_NAME]: "Basic Name Information",
  [ExcelFormatType.EMPLOYEE_ID_ONLY]: "Worker ID List",
  [ExcelFormatType.PERSON_ID_ONLY]: "Person ID Numbers",
} as const;

/**
 * Configuration for format pattern matching.
 * Defines which fields are required for each format type with confidence scores.
 */
const FORMAT_PATTERNS = {
  [ExcelFormatType.COMPLETE_EMPLOYEE]: {
    requiredFields: ["id", "firstName", "lastName", "employee_number"],
    confidence: 1.0,
  },
  [ExcelFormatType.BASIC_NAME]: {
    requiredFields: ["firstName", "lastName"],
    confidence: 0.9,
  },
  [ExcelFormatType.EMPLOYEE_ID_ONLY]: {
    requiredFields: ["worker_id"],
    confidence: 0.8,
  },
  [ExcelFormatType.PERSON_ID_ONLY]: {
    requiredFields: ["person_id_number"],
    confidence: 0.8,
  },
} as const;

// ============================================================================
// CACHES
// ============================================================================

/**
 * Cache for loaded translations to avoid repeated file loads.
 * Maps language codes to their respective translation objects.
 */
const translationCache = new Map<SupportedLanguage, ExcelTranslations>();

/**
 * Cache for format detection results using WeakMap for automatic cleanup.
 * Provides O(1) lookup for previously analyzed files.
 */
const formatDetectionCache = new WeakMap<File, FormatDetectionResult>();

// ============================================================================
// CORE UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalizes header strings for consistent matching across languages.
 * Converts to lowercase, trims whitespace, and normalizes internal spacing.
 *
 * @param header - The raw header string from Excel file
 * @returns Normalized header string for comparison
 */
function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Determines if a row should be considered empty based on configuration.
 * Checks if all values are null, undefined, or empty strings after trimming.
 *
 * @param row - Excel row data as key-value pairs
 * @returns True if the row should be considered empty
 */
function isEmptyRow(row: Record<string, any>): boolean {
  return Object.values(row).every(
    (val) => !val || val.toString().trim() === ""
  );
}

/**
 * Creates a safe error message, ensuring it's always a string.
 * Handles both Error objects and unknown error types.
 *
 * @param error - Error object or unknown value
 * @returns Error message as string
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

/**
 * Determines the primary language from header mappings based on successful matches.
 * Uses the language with the most successful header mappings.
 *
 * @param headerMappings - Array of header mappings with language information
 * @returns Detected primary language code
 */
function detectPrimaryLanguage(headerMappings: HeaderMapping[]): string {
  const languageCount = new Map<string, number>();

  headerMappings.forEach((mapping) => {
    const count = languageCount.get(mapping.language) || 0;
    languageCount.set(mapping.language, count + 1);
  });

  return (
    Array.from(languageCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "en"
  );
}

// ============================================================================
// TRANSLATION MANAGEMENT
// ============================================================================

/**
 * Loads and caches translations for a specific language.
 * Uses dynamic imports to avoid bundling all translations and implements
 * automatic fallback to English for unsupported languages.
 *
 * @param language - Target language code (en, he, ru)
 * @returns Promise resolving to translation object
 * @throws Error if unable to load any translations
 */
async function loadTranslations(
  language: SupportedLanguage
): Promise<ExcelTranslations> {
  // Return cached translation if available
  if (translationCache.has(language)) {
    return translationCache.get(language)!;
  }

  try {
    const translations = await import(
      `@/i18n/locales/${language}/translate.json`
    );

    const excelTranslations: ExcelTranslations = {
      excel_headers: translations.default.excel_headers,
      excel_formats: translations.default.excel_formats,
      excel_errors: translations.default.excel_errors,
    };

    translationCache.set(language, excelTranslations);
    return excelTranslations;
  } catch (error) {
    console.error(
      `Failed to load translations for language: ${language}`,
      error
    );

    // Fallback to English if not already trying English
    if (language !== "en") {
      return loadTranslations("en");
    }

    throw new Error(`Failed to load translations for ${language}`);
  }
}

/**
 * Creates a header-to-field mapping from translation data.
 * Generates both exact and case-insensitive mappings for flexible matching.
 *
 * @param translations - Translation object containing header mappings
 * @returns Map of header strings to normalized field names
 */
function createHeaderMapping(
  translations: ExcelTranslations
): Map<string, string> {
  const headerMap = new Map<string, string>();

  for (const [fieldName, headers] of Object.entries(
    translations.excel_headers
  )) {
    for (const header of headers) {
      headerMap.set(header, fieldName);
      headerMap.set(header.toLowerCase(), fieldName);
    }
  }

  return headerMap;
}

// ============================================================================
// HEADER MAPPING AND DETECTION
// ============================================================================

/**
 * Maps raw Excel headers to normalized field names with multi-language support.
 * Uses confidence scoring to select the best matching language and header combination.
 *
 * @param rawHeaders - Array of header strings from Excel file
 * @param preferredLanguage - Language preference or "auto" for automatic detection
 * @returns Promise resolving to array of header mappings with confidence scores
 */
export async function mapHeaders(
  rawHeaders: string[],
  preferredLanguage: "en" | "he" | "ru" | "auto" = "auto"
): Promise<HeaderMapping[]> {
  const mappings: HeaderMapping[] = [];
  const languagesToCheck: SupportedLanguage[] =
    preferredLanguage === "auto" ? ["en", "he", "ru"] : [preferredLanguage];

  const translationsMap = await loadTranslationMaps(languagesToCheck);

  for (const rawHeader of rawHeaders) {
    const bestMapping = findBestMappingForHeader(rawHeader, translationsMap);
    if (bestMapping) {
      mappings.push(bestMapping);
    }
  }

  return mappings;
}

/**
 * Loads translation maps for multiple languages efficiently.
 *
 * @param languagesToCheck - Array of languages to load translations for
 * @returns Promise resolving to map of language to header mappings
 */
async function loadTranslationMaps(
  languagesToCheck: SupportedLanguage[]
): Promise<Map<SupportedLanguage, Map<string, string>>> {
  const translationsMap = new Map<SupportedLanguage, Map<string, string>>();

  for (const lang of languagesToCheck) {
    try {
      const translations = await loadTranslations(lang);
      const headerMap = createHeaderMapping(translations);
      translationsMap.set(lang, headerMap);
    } catch (error) {
      console.warn(`Failed to load translations for ${lang}:`, error);
    }
  }

  return translationsMap;
}

/**
 * Finds the best mapping for a single header across all available languages.
 *
 * @param rawHeader - The header string to map
 * @param translationsMap - Map of language to header mappings
 * @returns Best header mapping or null if no match found
 */
function findBestMappingForHeader(
  rawHeader: string,
  translationsMap: Map<SupportedLanguage, Map<string, string>>
): HeaderMapping | null {
  let bestMapping: HeaderMapping | null = null;

  for (const [lang, headerMap] of translationsMap.entries()) {
    const mapping = findBestHeaderMatch(rawHeader, headerMap, lang);

    if (
      mapping &&
      (!bestMapping || mapping.confidence > bestMapping.confidence)
    ) {
      bestMapping = mapping;
    }
  }

  return bestMapping;
}

/**
 * Finds the best matching field for a given header in a specific language.
 * Implements a three-tier matching strategy: exact, case-insensitive, and partial.
 *
 * @param rawHeader - The header string to match
 * @param headerMap - Map of headers to field names for a specific language
 * @param language - The language being checked
 * @returns HeaderMapping object with confidence score, or null if no match
 */
function findBestHeaderMatch(
  rawHeader: string,
  headerMap: Map<string, string>,
  language: SupportedLanguage
): HeaderMapping | null {
  // Exact match (highest confidence)
  let mappedField = headerMap.get(rawHeader.trim());
  if (mappedField) {
    return createMappingResult(rawHeader, mappedField, language, 1.0);
  }

  // Case-insensitive match
  mappedField = headerMap.get(normalizeHeader(rawHeader));
  if (mappedField) {
    return createMappingResult(rawHeader, mappedField, language, 0.9);
  }

  // Partial matching (lowest confidence)
  const normalizedInput = normalizeHeader(rawHeader);
  for (const [headerKey, fieldValue] of headerMap.entries()) {
    const normalizedKey = normalizeHeader(headerKey);
    if (
      normalizedKey.includes(normalizedInput) ||
      normalizedInput.includes(normalizedKey)
    ) {
      return createMappingResult(rawHeader, fieldValue, language, 0.7);
    }
  }

  return null;
}

/**
 * Creates a HeaderMapping object with the provided parameters.
 *
 * @param originalHeader - The original header string
 * @param normalizedField - The normalized field name
 * @param language - The language used for mapping
 * @param confidence - The confidence score of the mapping
 * @returns HeaderMapping object
 */
function createMappingResult(
  originalHeader: string,
  normalizedField: string,
  language: SupportedLanguage,
  confidence: number
): HeaderMapping {
  return {
    originalHeader,
    normalizedField,
    language,
    confidence,
  };
}

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Detects Excel format based on mapped headers using pattern matching.
 * Returns format type with confidence score and detected language.
 *
 * @param headers - Array of header strings from Excel file
 * @param config - Import configuration including language preference
 * @returns Promise resolving to format detection result
 * @throws Error with localized message if format cannot be determined
 */
export async function detectExcelFormat(
  headers: string[],
  config: ExcelImportConfig = {}
): Promise<FormatDetectionResult> {
  const headerMappings = await mapHeaders(headers, config.language);
  const mappedFields = new Set(headerMappings.map((m) => m.normalizedField));
  const detectedLanguage = detectPrimaryLanguage(headerMappings);

  const formatResult = detectFormatPattern(
    mappedFields,
    headers,
    detectedLanguage
  );

  if (formatResult) {
    return formatResult;
  }

  await throwLocalizedFormatError(
    headers,
    detectedLanguage as SupportedLanguage
  );
  throw new Error("Format detection failed"); // This line should never be reached
}

/**
 * Checks mapped fields against known format patterns using the configuration.
 * Returns the first matching format with appropriate confidence score.
 *
 * @param mappedFields - Set of normalized field names
 * @param headers - Original header strings
 * @param detectedLanguage - Primary detected language
 * @returns FormatDetectionResult or null if no pattern matches
 */
function detectFormatPattern(
  mappedFields: Set<string>,
  headers: string[],
  detectedLanguage: string
): FormatDetectionResult | null {
  for (const [formatType, pattern] of Object.entries(FORMAT_PATTERNS)) {
    if (pattern.requiredFields.every((field) => mappedFields.has(field))) {
      return {
        formatType: formatType as ExcelFormatType,
        confidence: pattern.confidence,
        detectedHeaders: headers,
        language: detectedLanguage,
      };
    }
  }

  return null;
}

/**
 * Throws a localized error message for unrecognized formats.
 * Falls back to English if translation loading fails.
 *
 * @param headers - Array of header strings for error context
 * @param detectedLanguage - Language for error message
 * @throws Error with localized message
 */
async function throwLocalizedFormatError(
  headers: string[],
  detectedLanguage: SupportedLanguage
): Promise<never> {
  try {
    const translations = await loadTranslations(detectedLanguage);
    const errorMessage = translations.excel_errors.unrecognized_format.replace(
      "{{headers}}",
      headers.join(", ")
    );
    throw new Error(errorMessage);
  } catch (translationError) {
    throw new Error(
      `Unrecognized Excel format. Available headers: ${headers.join(", ")}`
    );
  }
}

// ============================================================================
// DATA CONVERSION AND VALIDATION
// ============================================================================

/**
 * Converts a raw Excel row to a typed format based on the detected format type.
 * Normalizes field names using header mappings and provides appropriate defaults.
 *
 * @param row - Raw Excel row data as key-value pairs
 * @param formatType - Detected Excel format type
 * @param headerMappings - Array of header mappings for field normalization
 * @returns Typed format object based on the format type
 * @throws Error for unsupported format types
 */
function convertRowToFormat(
  row: Record<string, any>,
  formatType: ExcelFormatType,
  headerMappings: HeaderMapping[]
): ExcelImportFormat {
  // Create efficient field mapping lookup
  const fieldMap = new Map<string, string>();
  headerMappings.forEach((mapping) => {
    fieldMap.set(mapping.originalHeader, mapping.normalizedField);
  });

  // Normalize row data with field mapping
  const normalizedRow: Record<string, any> = {};
  for (const [originalKey, value] of Object.entries(row)) {
    const normalizedKey = fieldMap.get(originalKey) || originalKey;
    normalizedRow[normalizedKey] = value?.toString?.().trim() || "";
  }

  // Convert to appropriate format type
  switch (formatType) {
    case ExcelFormatType.COMPLETE_EMPLOYEE:
      return {
        id: normalizedRow.id || "",
        firstName: normalizedRow.firstName || "",
        lastName: normalizedRow.lastName || "",
        employee_number: normalizedRow.employee_number || "",
      } as CompleteEmployeeFormat;

    case ExcelFormatType.BASIC_NAME:
      return {
        firstName: normalizedRow.firstName || "",
        lastName: normalizedRow.lastName || "",
      } as BasicNameFormat;

    case ExcelFormatType.EMPLOYEE_ID_ONLY:
      return {
        worker_id: normalizedRow.worker_id || "",
      } as WorkerIdOnlyFormat;

    case ExcelFormatType.PERSON_ID_ONLY:
      return {
        person_id_number: normalizedRow.person_id_number || "",
      } as PersonIdOnlyFormat;

    default:
      throw new Error(`Unsupported format type: ${formatType}`);
  }
}

/**
 * Validates a converted record based on format-specific requirements.
 * Uses the configuration pattern to determine required fields dynamically.
 *
 * @param record - Converted record to validate
 * @param formatType - Format type defining required fields
 * @returns True if all required fields are present and non-empty
 */
function validateRecord(
  record: ExcelImportFormat,
  formatType: ExcelFormatType
): boolean {
  const pattern = FORMAT_PATTERNS[formatType];
  if (!pattern) return false;

  return pattern.requiredFields.every((fieldName) => {
    const value = (record as any)[fieldName];
    return value && value.toString().trim() !== "";
  });
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Creates localized error messages for various error types.
 * Provides a unified interface for generating error messages with fallbacks.
 */
class ErrorMessageFactory {
  /**
   * Creates a localized error message for missing required fields.
   *
   * @param rowIndex - Zero-based row index for error context
   * @param language - Language for error message
   * @returns Promise resolving to localized error message
   */
  static async createMissingFieldsError(
    rowIndex: number,
    language: SupportedLanguage
  ): Promise<string> {
    try {
      const translations = await loadTranslations(language);
      return translations.excel_errors.missing_required_fields.replace(
        "{{row}}",
        (rowIndex + 1).toString()
      );
    } catch {
      return `Row ${rowIndex + 1}: Missing required fields`;
    }
  }

  /**
   * Creates a localized error message for row processing errors.
   *
   * @param rowIndex - Zero-based row index for error context
   * @param error - Original error that occurred
   * @param language - Language for error message
   * @returns Promise resolving to localized error message
   */
  static async createProcessingError(
    rowIndex: number,
    error: unknown,
    language: SupportedLanguage
  ): Promise<string> {
    try {
      const translations = await loadTranslations(language);
      return translations.excel_errors.processing_error
        .replace("{{row}}", (rowIndex + 1).toString())
        .replace("{{error}}", getErrorMessage(error));
    } catch {
      return `Row ${rowIndex + 1}: ${getErrorMessage(error)}`;
    }
  }

  /**
   * Creates a localized error message for empty files.
   *
   * @param language - Language for error message
   * @returns Promise resolving to localized error message
   */
  static async createEmptyFileError(
    language: SupportedLanguage
  ): Promise<string> {
    try {
      const translations = await loadTranslations(language);
      return translations.excel_errors.empty_file;
    } catch {
      return "Excel file is empty or invalid";
    }
  }
}

// ============================================================================
// MAIN EXCEL PROCESSING FUNCTION
// ============================================================================

/**
 * Main function to parse Excel files with automatic format detection and i18n support.
 *
 * This function provides comprehensive Excel processing with the following features:
 * - Automatic format detection based on headers
 * - Multi-language header support (English, Hebrew, Russian)
 * - Performance optimization through caching
 * - Configurable validation and error handling
 * - Localized error messages
 *
 * @param file - Excel file to process
 * @param config - Configuration options for import behavior
 * @returns Promise resolving to complete import result with data and metadata
 * @throws Error with localized message if file is empty or invalid
 */
export async function parseExcelFile(
  file: File,
  config: ExcelImportConfig = {}
): Promise<ExcelImportResult> {
  // Check cache for previously detected format
  const cachedResult = formatDetectionCache.get(file);
  const formatResult =
    cachedResult && !config.language
      ? cachedResult
      : await detectFormatFromFile(file, config);

  if (!cachedResult) {
    formatDetectionCache.set(file, formatResult);
  }

  // Import and process Excel data
  const { convertExcelToJson } = await import("@/utils/excelToJson");
  const jsonData = await convertExcelToJson(file);

  // Get header mappings for data conversion
  const headers = Object.keys(jsonData[0]);
  const headerMappings = await mapHeaders(headers, config.language);

  // Process all rows with conversion, validation, and error handling
  const { convertedData, validRecords, errors } = await processExcelRows(
    jsonData,
    formatResult,
    headerMappings,
    config
  );

  return {
    formatType: formatResult.formatType,
    data: convertedData,
    totalRecords: jsonData.length,
    validRecords,
    errors: errors.length > 0 ? errors : undefined,
    language: formatResult.language,
  };
}

/**
 * Detects format from Excel file, handling empty files appropriately.
 *
 * @param file - Excel file to analyze
 * @param config - Import configuration
 * @returns Promise resolving to format detection result
 * @throws Error with localized message if file is empty
 */
async function detectFormatFromFile(
  file: File,
  config: ExcelImportConfig
): Promise<FormatDetectionResult> {
  const { convertExcelToJson } = await import("@/utils/excelToJson");
  const jsonData = await convertExcelToJson(file);

  if (!jsonData || jsonData.length === 0) {
    const language =
      config.language && config.language !== "auto" ? config.language : "en";
    const errorMessage = await ErrorMessageFactory.createEmptyFileError(
      language
    );
    throw new Error(errorMessage);
  }

  const headers = Object.keys(jsonData[0]);
  return detectExcelFormat(headers, config);
}

/**
 * Processes all Excel rows with conversion, validation, and error handling.
 * Implements efficient row processing with comprehensive error tracking.
 *
 * @param jsonData - Raw Excel data as array of objects
 * @param formatResult - Detected format information
 * @param headerMappings - Header mapping configuration
 * @param config - Import configuration
 * @returns Object containing converted data, valid record count, and errors
 */
async function processExcelRows(
  jsonData: any[],
  formatResult: FormatDetectionResult,
  headerMappings: HeaderMapping[],
  config: ExcelImportConfig
): Promise<{
  convertedData: ExcelImportFormat[];
  validRecords: number;
  errors: string[];
}> {
  const convertedData: ExcelImportFormat[] = [];
  const errors: string[] = [];
  let validRecords = 0;

  const language = (formatResult.language as SupportedLanguage) || "en";

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];

    // Skip empty rows if configured
    if (config.skipEmptyRows && isEmptyRow(row)) {
      continue;
    }

    try {
      const convertedRow = convertRowToFormat(
        row,
        formatResult.formatType,
        headerMappings
      );

      const isValid =
        !config.validateRequired ||
        validateRecord(convertedRow, formatResult.formatType);

      if (isValid) {
        convertedData.push(convertedRow);
        validRecords++;
      } else {
        const errorMessage = await ErrorMessageFactory.createMissingFieldsError(
          i,
          language
        );
        errors.push(errorMessage);
      }
    } catch (error) {
      const errorMessage = await ErrorMessageFactory.createProcessingError(
        i,
        error,
        language
      );
      errors.push(errorMessage);
    }
  }

  return { convertedData, validRecords, errors };
}

// ============================================================================
// PUBLIC UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets a localized display name for a specific Excel format type.
 * Falls back to English names if translation loading fails.
 *
 * @param formatType - Excel format type to get display name for
 * @param language - Target language for display name (defaults to English)
 * @returns Promise resolving to localized format display name
 */
export async function getFormatDisplayName(
  formatType: ExcelFormatType,
  language: SupportedLanguage = "en"
): Promise<string> {
  try {
    const translations = await loadTranslations(language);
    return translations.excel_formats[formatType] || formatType;
  } catch {
    return FALLBACK_FORMAT_NAMES[formatType] || formatType;
  }
}

/**
 * Gets expected header names for a format type in a specific language.
 * Provides the primary header name for each required field.
 * Falls back to English headers if translation loading fails.
 *
 * @param formatType - Excel format type to get headers for
 * @param language - Target language for header names (defaults to English)
 * @returns Promise resolving to array of expected header names
 */
export async function getExpectedHeaders(
  formatType: ExcelFormatType,
  language: SupportedLanguage = "en"
): Promise<string[]> {
  try {
    const translations = await loadTranslations(language);
    return getHeadersForFormat(formatType, translations);
  } catch {
    return language !== "en" ? getExpectedHeaders(formatType, "en") : [];
  }
}

/**
 * Extracts header names for a specific format from translations.
 *
 * @param formatType - Excel format type
 * @param translations - Translation object
 * @returns Array of header names for the format
 */
function getHeadersForFormat(
  formatType: ExcelFormatType,
  translations: ExcelTranslations
): string[] {
  const headerMap = {
    [ExcelFormatType.COMPLETE_EMPLOYEE]: [
      translations.excel_headers.id[0],
      translations.excel_headers.firstName[0],
      translations.excel_headers.lastName[0],
      translations.excel_headers.employee_number[0],
    ],
    [ExcelFormatType.BASIC_NAME]: [
      translations.excel_headers.firstName[0],
      translations.excel_headers.lastName[0],
    ],
    [ExcelFormatType.EMPLOYEE_ID_ONLY]: [
      translations.excel_headers.worker_id[0],
    ],
    [ExcelFormatType.PERSON_ID_ONLY]: [
      translations.excel_headers.person_id_number[0],
    ],
  };

  return headerMap[formatType] || [];
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Converts Excel file to NewPerson array format for backward compatibility.
 * Maps different Excel formats to proper Person fields for database creation.
 * This function maintains compatibility with the legacy person creation workflow.
 *
 * @param file - Excel file to process
 * @returns Promise resolving to array of NewPerson objects or null on error
 */
export async function excelFileToPersonList(
  file: File
): Promise<NewPerson[] | null> {
  try {
    const result = await parseExcelFile(file, {
      language: "auto",
      skipEmptyRows: true,
      validateRequired: false,
    });

    return result.data.map(
      (record): NewPerson => convertRecordToPerson(record, result.formatType)
    );
  } catch (error) {
    console.error("Excel file processing failed:", error);
    return null;
  }
}

/**
 * Converts a single Excel record to NewPerson format based on the detected format type.
 * Handles all supported Excel formats and maps fields appropriately.
 *
 * @param record - Excel record in detected format
 * @param formatType - The detected Excel format type
 * @returns NewPerson object with mapped fields
 */
function convertRecordToPerson(
  record: ExcelImportFormat,
  formatType: ExcelFormatType
): NewPerson {
  const person: NewPerson = { sourceFormat: formatType };

  switch (formatType) {
    case ExcelFormatType.COMPLETE_EMPLOYEE:
      const complete = record as CompleteEmployeeFormat;
      person.firstName = complete.firstName || "";
      person.lastName = complete.lastName || "";
      person.employeeId = complete.employee_number || "";
      break;

    case ExcelFormatType.BASIC_NAME:
      const basic = record as BasicNameFormat;
      person.firstName = basic.firstName || "";
      person.lastName = basic.lastName || "";
      break;

    case ExcelFormatType.EMPLOYEE_ID_ONLY:
      const worker = record as WorkerIdOnlyFormat;
      person.employeeId = worker.worker_id || "";
      break;

    case ExcelFormatType.PERSON_ID_ONLY:
      const personId = record as PersonIdOnlyFormat;
      person.personId = personId.person_id_number || "";
      break;
  }

  return person;
}
