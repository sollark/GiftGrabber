/**
 * Usage examples for the i18n-enabled Excel import functionality.
 * Demonstrates automatic format detection with multi-language support.
 * All examples are for documentation and testing purposes only.
 */

import logger from "@/lib/logger";
import {
  parseExcelFile,
  getFormatDisplayName,
  getExpectedHeaders,
} from "@/utils/excel_utils";
import {
  ExcelFormatType,
  ExcelImportConfig,
  isCompleteEmployeeFormat,
  isBasicNameFormat,
  isWorkerIdOnlyFormat,
  isPersonIdOnlyFormat,
} from "@/types/excel.types";

/**
 * Example 1: Basic automatic detection with multi-language support.
 * @param file - Excel file to import
 * @returns {Promise<any>} Import result
 */
export async function importExcelWithAutoDetection(file: File) {
  try {
    // Auto-detect language and format
    const result = await parseExcelFile(file, {
      language: "auto",
      skipEmptyRows: true,
      validateRequired: true,
    });

    logger.info(`Detected format: ${result.formatType}`);
    logger.info(`Detected language: ${result.language}`);
    logger.info(`Valid records: ${result.validRecords}/${result.totalRecords}`);

    if (result.errors) {
      console.warn("Import warnings:", result.errors);
    }

    return result;
  } catch (error) {
    console.error("Import failed:", error);
    throw error;
  }
}

/**
 * Example 2: Force specific language for header detection
 */
export async function importExcelWithSpecificLanguage(
  file: File,
  language: "en" | "he" | "ru"
) {
  const config: ExcelImportConfig = {
    language,
    skipEmptyRows: true,
    validateRequired: false,
    trimWhitespace: true,
  };

  const result = await parseExcelFile(file, config);

  // Get localized format name
  const formatName = await getFormatDisplayName(result.formatType, language);
  logger.info(`Format: ${formatName}`);

  return result;
}

/**
 * Example 3: Process different format types with type safety
 */
export async function processExcelByFormat(file: File) {
  const result = await parseExcelFile(file, { language: "auto" });

  switch (result.formatType) {
    case ExcelFormatType.COMPLETE_EMPLOYEE:
      logger.info("Processing complete employee data...");
      result.data.forEach((record) => {
        if (isCompleteEmployeeFormat(record)) {
          logger.info(
            `Employee: ${record.firstName} ${record.lastName} (${record.employee_number})`
          );
        }
      });
      break;

    case ExcelFormatType.BASIC_NAME:
      logger.info("Processing basic name data...");
      result.data.forEach((record) => {
        if (isBasicNameFormat(record)) {
          logger.info(`Person: ${record.firstName} ${record.lastName}`);
        }
      });
      break;

    case ExcelFormatType.EMPLOYEE_ID_ONLY:
      logger.info("Processing worker ID list...");
      result.data.forEach((record) => {
        if (isWorkerIdOnlyFormat(record)) {
          logger.info(`Worker ID: ${record.worker_id}`);
        }
      });
      break;

    case ExcelFormatType.PERSON_ID_ONLY:
      logger.info("Processing person ID list...");
      result.data.forEach((record) => {
        if (isPersonIdOnlyFormat(record)) {
          logger.info(`Person ID: ${record.person_id_number}`);
        }
      });
      break;

    default:
      console.warn("Unknown format type");
  }

  return result;
}

/**
 * Example 4: Get expected headers for user guidance
 */
export async function showExpectedHeaders() {
  const languages: Array<"en" | "he" | "ru"> = ["en", "he", "ru"];
  const formats = [
    ExcelFormatType.COMPLETE_EMPLOYEE,
    ExcelFormatType.BASIC_NAME,
    ExcelFormatType.EMPLOYEE_ID_ONLY,
    ExcelFormatType.PERSON_ID_ONLY,
  ];

  for (const format of formats) {
    logger.info(`\n${format.toUpperCase()}:`);

    for (const lang of languages) {
      const headers = await getExpectedHeaders(format, lang);
      const formatName = await getFormatDisplayName(format, lang);
      logger.info(`  ${lang}: ${formatName} - [${headers.join(", ")}]`);
    }
  }
}

/**
 * Example 5: Error handling with localized messages
 */
export async function importWithErrorHandling(
  file: File,
  language: "en" | "he" | "ru" = "en"
) {
  try {
    const result = await parseExcelFile(file, {
      language,
      validateRequired: true,
      skipEmptyRows: true,
    });

    if (result.errors && result.errors.length > 0) {
      logger.warn("Import completed with warnings:");
      result.errors.forEach((error, index) => {
        logger.warn(`  ${index + 1}. ${error}`);
      });
    }

    logger.info(`Successfully imported ${result.validRecords} records`);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Import failed:", error.message);

      // Error messages are already localized based on detected language
      if (error.message.includes("זמינות") || error.message.includes("ריק")) {
        logger.warn("Hebrew error detected");
      } else if (
        error.message.includes("Доступные") ||
        error.message.includes("пустой")
      ) {
        logger.warn("Russian error detected");
      } else {
        logger.warn("English error detected");
      }
    }
    throw error;
  }
}

/**
 * Example 6: Performance monitoring with multi-language support
 */
export async function importWithPerformanceMonitoring(file: File) {
  const startTime = performance.now();

  try {
    const result = await parseExcelFile(file, {
      language: "auto",
      skipEmptyRows: true,
      validateRequired: false,
    });

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Performance metrics
    logger.info("Performance Metrics:");
    logger.info(`- File size: ${(file.size / 1024).toFixed(2)} KB`);
    logger.info(`- Processing time: ${processingTime.toFixed(2)}ms`);
    logger.info(`- Records processed: ${result.totalRecords}`);
    logger.info(`- Valid records: ${result.validRecords}`);
    logger.info(
      `- Speed: ${(result.totalRecords / (processingTime / 1000)).toFixed(
        2
      )} records/second`
    );
    logger.info(`- Detected format: ${result.formatType}`);
    logger.info(`- Detected language: ${result.language}`);

    return result;
  } catch (error) {
    const endTime = performance.now();
    console.error(
      `Import failed after ${(endTime - startTime).toFixed(2)}ms:`,
      error
    );
    throw error;
  }
}

/**
 * Example 7: Batch processing multiple files
 */
export async function processBatchFiles(files: File[]) {
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    logger.info(`Processing file ${i + 1}/${files.length}: ${file.name}`);

    try {
      const result = await parseExcelFile(file, {
        language: "auto",
        skipEmptyRows: true,
        validateRequired: true,
      });

      results.push({
        fileName: file.name,
        success: true,
        formatType: result.formatType,
        language: result.language,
        recordCount: result.validRecords,
        data: result.data,
      });
    } catch (error) {
      results.push({
        fileName: file.name,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  logger.info(
    `\nBatch processing complete: ${successful}/${files.length} files processed successfully`
  );

  return results;
}

/**
 * Supported file formats and their expected headers in all languages:
 *
 * COMPLETE_EMPLOYEE:
 * - English: ["id", "name", "last_name", "employee_number"]
 * - Hebrew: ["מזהה", "שם", "שם משפחה", "מספר עובד"]
 * - Russian: ["ид", "имя", "фамилия", "номер_сотрудника"]
 *
 * BASIC_NAME:
 * - English: ["name", "last_name"]
 * - Hebrew: ["שם", "שם משפחה"]
 * - Russian: ["имя", "фамилия"]
 *
 * EMPLOYEE_ID_ONLY:
 * - English: ["worker_id"]
 * - Hebrew: ["מזהה עובד"]
 * - Russian: ["ид_работника"]
 *
 * PERSON_ID_ONLY:
 * - English: ["person_id_number"]
 * - Hebrew: ["תעודת זהות"]
 * - Russian: ["паспорт"]
 */
