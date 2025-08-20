import ControlledFileInput from "@/ui/form/ControlledFileInput";
import FormatDetectionInfo from "@/ui/data-display/FormatDetectionInfo";
import { ExcelFormatType } from "@/types/excel.types";
import { useState, useCallback } from "react";
import { parseExcelFile } from "@/utils/excel_utils";
import { FORM_CONFIG } from "@/config/eventFormConfig";

/**
 * Props for the FormFileSection component
 */
// interface FormFileSectionProps {
//   onFormatDetected?: (formatInfo: {
//     applicantFormat?: ExcelFormatType;
//     approverFormat?: ExcelFormatType;
//     detectedLanguage?: string;
//   }) => void;
// }

/**
 * Component for rendering file input fields with format detection
 */
const FormFileSection: React.FC = (
  {
    // onFormatDetected,
  }
) => {
  const [formatInfo, setFormatInfo] = useState<{
    applicantFormat?: ExcelFormatType;
    approverFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
    processingWarnings?: string[];
  }>({});

  const [isDetecting, setIsDetecting] = useState(false);

  /**
   * Handles file selection and format detection
   */
  const handleFileChange = useCallback(
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
          ...formatInfo,
          [fieldName === "applicantsFile"
            ? "applicantFormat"
            : "approverFormat"]: detectionResult.formatType,
          detectedLanguage: detectionResult.language,
          totalRecords: detectionResult.totalRecords,
          validRecords: detectionResult.validRecords,
        };

        setFormatInfo(newFormatInfo);
        // onFormatDetected?.(newFormatInfo);
      } catch (error) {
        console.error("Format detection failed:", error);
        setFormatInfo({
          ...formatInfo,
          processingWarnings: [
            ...(formatInfo.processingWarnings || []),
            `Format detection failed for ${fieldName}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          ],
        });
      } finally {
        setIsDetecting(false);
      }
    },
    [formatInfo]
  );

  return (
    <div>
      <ControlledFileInput
        name="applicantsFile"
        label="List of applicants"
        type="file"
        variant="outlined"
        inputProps={FORM_CONFIG.INPUT_STYLES}
        onChange={(file: File) => handleFileChange(file, "applicantsFile")}
      />
      <ControlledFileInput
        name="approversFile"
        label="List of approvers (optional)"
        type="file"
        variant="outlined"
        inputProps={FORM_CONFIG.INPUT_STYLES}
        required={false}
        onChange={(file: File) => handleFileChange(file, "approversFile")}
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
