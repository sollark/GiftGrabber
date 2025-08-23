import ControlledFileInput from "@/ui/form/ControlledFileInput";
import FormatDetectionInfo from "@/ui/data-display/FormatDetectionInfo";
import { ExcelFormatType } from "@/types/excel.types";
import { useState, useCallback, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { parseExcelFile } from "@/utils/excel_utils";
import { FORM_CONFIG } from "@/config/eventFormConfig";

/**
 * Props for the FormFileSection component
 */
interface FormFileSectionProps {
  /**
   * Callback fired when file format detection encounters an error
   * @param error Error message describing the file processing failure
   */
  onFormatError?: (error: string) => void;
  /**
   * Callback fired when file format detection succeeds
   * @param formatInfo Detected format information including type and language
   */
  onFormatSuccess?: (formatInfo: {
    applicantFormat?: ExcelFormatType;
    approverFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
  }) => void;
}

/**
 * Component for rendering file input fields with format detection and error propagation
 */
const FormFileSection: React.FC<FormFileSectionProps> = ({
  onFormatError,
  onFormatSuccess,
}) => {
  const { watch } = useFormContext();
  const [formatInfo, setFormatInfo] = useState<{
    applicantFormat?: ExcelFormatType;
    approverFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
    processingWarnings?: string[];
  }>({});

  const [isDetecting, setIsDetecting] = useState(false);

  // Watch for file changes in the form
  const applicantsFile = watch("applicantsFile");
  const approversFile = watch("approversFile");

  /**
   * Handles file format detection when files change in the form
   * @param file The selected Excel file to process
   * @param fieldName The form field name ('applicantsFile' or 'approversFile')
   */
  const detectFileFormat = useCallback(
    async (file: File, fieldName: string) => {
      if (!file) return;

      setIsDetecting(true);
      try {
        const detectionResult = await parseExcelFile(file, {
          language: "auto",
          skipEmptyRows: true,
          validateRequired: false,
        });

        const newFormatInfo = {
          [fieldName === "applicantsFile"
            ? "applicantFormat"
            : "approverFormat"]: detectionResult.formatType,
          detectedLanguage: detectionResult.language,
          totalRecords: detectionResult.totalRecords,
          validRecords: detectionResult.validRecords,
        };

        setFormatInfo((prev) => ({ ...prev, ...newFormatInfo }));
        onFormatSuccess?.(newFormatInfo);
      } catch (error) {
        const errorMessage = `Format detection failed for ${fieldName}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;

        console.error("Format detection failed:", error);
        setFormatInfo((prev) => ({
          ...prev,
          processingWarnings: [
            ...(prev.processingWarnings || []),
            errorMessage,
          ],
        }));

        onFormatError?.(errorMessage);
      } finally {
        setIsDetecting(false);
      }
    },
    [onFormatError, onFormatSuccess]
  );

  // Effect to detect format when applicants file changes
  useEffect(() => {
    if (applicantsFile instanceof File) {
      detectFileFormat(applicantsFile, "applicantsFile");
    }
  }, [applicantsFile, detectFileFormat]);

  // Effect to detect format when approvers file changes
  useEffect(() => {
    if (approversFile instanceof File) {
      detectFileFormat(approversFile, "approversFile");
    }
  }, [approversFile, detectFileFormat]);

  return (
    <div>
      <ControlledFileInput
        name="applicantsFile"
        label="List of applicants"
        type="file"
        variant="outlined"
        inputProps={FORM_CONFIG.INPUT_STYLES}
      />
      <ControlledFileInput
        name="approversFile"
        label="List of approvers (optional)"
        type="file"
        variant="outlined"
        inputProps={FORM_CONFIG.INPUT_STYLES}
        required={false}
      />

      {isDetecting && (
        <div className="mt-2 text-sm text-blue-600">
          🔍 Detecting file format...
        </div>
      )}

      <FormatDetectionInfo
        formatInfo={formatInfo}
        isVisible={Object.keys(formatInfo).length > 0}
      />
    </div>
  );
};

export default FormFileSection;
