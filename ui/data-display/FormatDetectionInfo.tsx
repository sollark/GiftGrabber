/**
 * FormatDetectionInfo.tsx
 *
 * Component for displaying Excel format detection results and processing information.
 * Provides users with feedback about detected file formats, languages, and processing status.
 */

import React from "react";
import { ExcelFormatType } from "@/types/excel.types";

/**
 * Props for the FormatDetectionInfo component
 */
interface FormatDetectionInfoProps {
  formatInfo?: {
    applicantFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
    processingWarnings?: string[];
  };
  isVisible?: boolean;
  className?: string;
}

/**
 * Maps Excel format types to user-friendly display names
 */
const formatDisplayNames: Record<ExcelFormatType, string> = {
  [ExcelFormatType.COMPLETE_EMPLOYEE]: "Complete Employee Data",
  [ExcelFormatType.BASIC_NAME]: "Basic Name List",
  [ExcelFormatType.EMPLOYEE_ID_ONLY]: "Employee ID Only",
  [ExcelFormatType.PERSON_ID_ONLY]: "Person ID Only",
};

/**
 * Maps language codes to display names
 */
const languageDisplayNames: Record<string, string> = {
  en: "English",
  he: "Hebrew",
  ru: "Russian",
  auto: "Auto-detected",
};

/**
 * FormatDetectionInfo component
 * Displays format detection results in a user-friendly format
 */
const FormatDetectionInfo: React.FC<FormatDetectionInfoProps> = ({
  formatInfo,
  isVisible = true,
  className = "",
}) => {
  if (!isVisible || !formatInfo) {
    return null;
  }

  const {
    applicantFormat,
    detectedLanguage,
    totalRecords,
    validRecords,
    processingWarnings,
  } = formatInfo;

  return (
    <div className={`format-detection-info ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">
          📊 File Processing Results
        </h3>

        <div className="space-y-2 text-sm">
          {/* Applicant file format */}
          {applicantFormat && (
            <div className="flex justify-between">
              <span className="text-gray-600">Applicant File Format:</span>
              <span className="font-medium text-blue-700">
                {formatDisplayNames[applicantFormat]}
              </span>
            </div>
          )}

          {/* Detected language */}
          {detectedLanguage && (
            <div className="flex justify-between">
              <span className="text-gray-600">Detected Language:</span>
              <span className="font-medium text-green-700">
                {languageDisplayNames[detectedLanguage] || detectedLanguage}
              </span>
            </div>
          )}

          {/* Record counts */}
          {totalRecords !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Total Records:</span>
              <span className="font-medium text-gray-800">{totalRecords}</span>
            </div>
          )}

          {validRecords !== undefined && (
            <div className="flex justify-between">
              <span className="text-gray-600">Valid Records:</span>
              <span className="font-medium text-green-600">{validRecords}</span>
            </div>
          )}

          {/* Processing warnings */}
          {processingWarnings && processingWarnings.length > 0 && (
            <div className="mt-3 pt-2 border-t border-blue-200">
              <span className="text-gray-600 text-xs">
                Processing Warnings:
              </span>
              <ul className="mt-1 space-y-1">
                {processingWarnings.map((warning, index) => (
                  <li
                    key={index}
                    className="text-xs text-amber-600 flex items-start"
                  >
                    <span className="mr-1">⚠️</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FormatDetectionInfo;
