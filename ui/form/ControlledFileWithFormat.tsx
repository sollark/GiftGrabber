"use client";

/**
 * ControlledFileWithFormat Component
 *
 * Purpose: Provides a file input component with automatic Excel format detection and validation.
 *
 * Main Responsibilities:
 * - Renders a controlled file input for Excel files within a React Hook Form context
 * - Automatically detects and validates Excel file format when a file is selected
 * - Displays format detection results and processing information to the user
 * - Provides error handling and progress indication during file processing
 * - Integrates with parent components through callback props for success/error handling
 *
 * Architecture Role:
 * - UI form component that bridges file input with Excel processing utilities
 * - Provides real-time feedback on file validity and format compatibility
 * - Centralizes file format detection logic for reuse across the application
 * - Maintains form state consistency through React Hook Form integration
 */

import { useState, useEffect, useCallback, memo } from "react";
import { useFormContext } from "react-hook-form";
import ControlledFileInput from "@/ui/form/ControlledFileInput";
import FormatDetectionInfo from "@/ui/data-display/FormatDetectionInfo";
import { ExcelFormatType } from "@/types/excel.types";
import { parseExcelFile } from "@/utils/excel_utils";
import { useErrorHandler } from "@/components/ErrorBoundary";

/**
 * Format information structure for Excel file detection results
 */
interface FormatInfo {
  applicantFormat?: ExcelFormatType;
  detectedLanguage?: string;
  totalRecords?: number;
  validRecords?: number;
  processingWarnings?: string[];
}

/**
 * Callback function type for format detection success
 */
type FormatSuccessCallback = (formatInfo: {
  applicantFormat?: ExcelFormatType;
  detectedLanguage?: string;
  totalRecords?: number;
  validRecords?: number;
}) => void;

/**
 * Props interface for ControlledFileWithFormat component
 */
interface ControlledFileWithFormatProps {
  /** Form field name - must be 'applicantsFile' for Excel processing */
  name: "applicantsFile";
  /** Display label for the file input */
  label: string;
  /** Whether the file input is required (default: true) */
  required?: boolean;
  /** Additional props passed to the underlying input element */
  inputProps?: Record<string, unknown>;
  /** Callback fired when format detection fails */
  onFormatError?: (error: string) => void;
  /** Callback fired when format detection succeeds */
  onFormatSuccess?: FormatSuccessCallback;
  /** CSS class name for the container div */
  className?: string;
}

/**
 * ControlledFileWithFormat Component
 *
 * A controlled file input component that automatically detects and validates Excel file formats.
 * Integrates with React Hook Form for form state management and provides real-time feedback
 * on file processing status and format compatibility.
 *
 * @param name - Form field name (must be 'applicantsFile')
 * @param label - Display label for the file input
 * @param required - Whether the file input is required (default: true)
 * @param inputProps - Additional props passed to the underlying input element
 * @param onFormatError - Callback fired when format detection fails
 * @param onFormatSuccess - Callback fired when format detection succeeds
 * @param className - CSS class name for the container div
 * @returns JSX.Element containing the file input and format detection UI
 */
const ControlledFileWithFormat: React.FC<ControlledFileWithFormatProps> = memo(
  function ControlledFileWithFormat({
    name,
    label,
    required = true,
    inputProps,
    onFormatError,
    onFormatSuccess,
    className,
  }) {
    // Form context hook for watching file changes
    const { watch } = useFormContext();

    // Watch for file changes in the form
    const file = watch(name);

    // Error handling hook for tracking and reporting errors
    const { handleError } = useErrorHandler("FileFormatDetection");

    // Local state for format detection results and processing status
    const [formatInfo, setFormatInfo] = useState<FormatInfo>({});
    const [isDetecting, setIsDetecting] = useState(false);

    /**
     * Detects and validates the format of an uploaded Excel file
     *
     * @param file - The File object to process and validate
     * @returns Promise<void> - Resolves when detection is complete
     * @sideEffects Updates formatInfo state, calls onFormatSuccess/onFormatError callbacks
     */
    const detectFileFormat = useCallback(
      async (file: File): Promise<void> => {
        if (!file) return;

        setIsDetecting(true);

        try {
          // Parse Excel file with auto-detection settings
          const detectionResult = await parseExcelFile(file, {
            language: "auto",
            skipEmptyRows: true,
            validateRequired: false,
          });

          // Build format information object
          const formatUpdate: FormatInfo = {
            applicantFormat: detectionResult.formatType as ExcelFormatType,
            detectedLanguage: detectionResult.language,
            totalRecords: detectionResult.totalRecords,
            validRecords: detectionResult.validRecords,
          };

          // Update local state
          setFormatInfo(formatUpdate);

          // Notify parent component of successful detection
          onFormatSuccess?.(formatUpdate);
        } catch (error) {
          const processedError =
            error instanceof Error ? error : new Error(String(error));

          // Track error for debugging and analytics
          handleError(processedError);

          const errorMessage = `Format detection failed for ${name}: ${processedError.message}`;
          console.error(errorMessage, processedError);

          // Update local state with warning
          setFormatInfo((prevInfo) => ({
            ...prevInfo,
            processingWarnings: [
              ...(prevInfo.processingWarnings ?? []),
              errorMessage,
            ],
          }));

          // Notify parent component of error
          onFormatError?.(errorMessage);
        } finally {
          setIsDetecting(false);
        }
      },
      [name, onFormatError, onFormatSuccess, handleError]
    );

    /**
     * Effect to trigger format detection when a new file is selected
     * Only processes File objects, ignoring null/undefined values
     */
    useEffect(() => {
      if (file instanceof File) {
        void detectFileFormat(file);
      }
    }, [file, detectFileFormat]);

    /**
     * Determines the container CSS classes
     *
     * @returns string - Combined CSS class names
     */
    const getContainerClassName = (): string => {
      return className ? `${className} mb-4` : "mb-4";
    };

    /**
     * Checks if format information should be displayed
     *
     * @returns boolean - True if there is format information to show
     */
    const shouldShowFormatInfo = (): boolean => {
      return Object.keys(formatInfo).length > 0;
    };

    return (
      <div className={getContainerClassName()}>
        <ControlledFileInput
          name={name}
          label={label}
          type="file"
          variant="outlined"
          required={required}
          inputProps={inputProps}
        />

        {isDetecting && (
          <div className="mt-2 text-sm text-blue-600">
            🔍 Detecting file format...
          </div>
        )}

        <FormatDetectionInfo
          formatInfo={formatInfo}
          isVisible={shouldShowFormatInfo()}
        />
      </div>
    );
  }
);

export default ControlledFileWithFormat;
