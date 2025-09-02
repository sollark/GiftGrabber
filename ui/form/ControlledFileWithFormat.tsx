import { useState, useEffect, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import ControlledFileInput from "@/ui/form/ControlledFileInput";
import FormatDetectionInfo from "@/ui/data-display/FormatDetectionInfo";
import { ExcelFormatType } from "@/types/excel.types";
import { parseExcelFile } from "@/utils/excel_utils";

interface ControlledFileWithFormatProps {
  name: "applicantsFile";
  label: string;
  required?: boolean;
  // passthrough styling/props just like your current usage
  inputProps?: Record<string, unknown>;
  // keep parent callbacks exactly as-is
  onFormatError?: (error: string) => void;
  onFormatSuccess?: (formatInfo: {
    applicantFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
  }) => void;
  className?: string;
}

const ControlledFileWithFormat: React.FC<ControlledFileWithFormatProps> = ({
  name,
  label,
  required = true,
  inputProps,
  onFormatError,
  onFormatSuccess,
  className,
}) => {
  const { watch } = useFormContext();
  const [formatInfo, setFormatInfo] = useState<{
    applicantFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
    processingWarnings?: string[];
  }>({});
  const [isDetecting, setIsDetecting] = useState(false);

  const file = watch(name);

  const detectFileFormat = useCallback(
    async (f: File) => {
      if (!f) return;

      setIsDetecting(true);
      try {
        const detectionResult = await parseExcelFile(f, {
          language: "auto",
          skipEmptyRows: true,
          validateRequired: false,
        });

        const specificKey = "applicantFormat";

        const update = {
          [specificKey]: detectionResult.formatType as ExcelFormatType,
          detectedLanguage: detectionResult.language,
          totalRecords: detectionResult.totalRecords,
          validRecords: detectionResult.validRecords,
        } as const;

        // local per-input panel
        setFormatInfo(update);

        // bubble up exactly as your original parent expected
        onFormatSuccess?.(update);
      } catch (error) {
        const msg = `Format detection failed for ${name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(msg, error);
        setFormatInfo((prev) => ({
          ...prev,
          processingWarnings: [...(prev.processingWarnings ?? []), msg],
        }));
        onFormatError?.(msg);
      } finally {
        setIsDetecting(false);
      }
    },
    [name, onFormatError, onFormatSuccess]
  );

  useEffect(() => {
    if (file instanceof File) {
      void detectFileFormat(file);
    }
  }, [file, detectFileFormat]);

  return (
    <div className={className ? `${className} mb-4` : "mb-4"}>
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
        isVisible={Object.keys(formatInfo).length > 0}
      />
    </div>
  );
};

export default ControlledFileWithFormat;
