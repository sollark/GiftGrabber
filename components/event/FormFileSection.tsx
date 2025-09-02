import ControlledFileWithFormat from "@/ui/form/ControlledFileWithFormat";
import "./formFileSection.css";
import { ExcelFormatType } from "@/types/excel.types";
import { FORM_CONFIG } from "@/config/eventFormConfig";

interface FormFileSectionProps {
  onFormatError?: (error: string) => void;
  onFormatSuccess?: (formatInfo: {
    applicantFormat?: ExcelFormatType;
    detectedLanguage?: string;
    totalRecords?: number;
    validRecords?: number;
  }) => void;
}

const FormFileSection: React.FC<FormFileSectionProps> = ({
  onFormatError,
  onFormatSuccess,
}) => {
  return (
    <div className="form-file-section">
      <ControlledFileWithFormat
        name="applicantsFile"
        label="List of applicants"
        inputProps={FORM_CONFIG.INPUT_STYLES}
        onFormatError={onFormatError}
        onFormatSuccess={onFormatSuccess}
        className="form-file-section"
      />

      <ControlledFileWithFormat
        name="applicantsFile"
        label="Extra file"
        required={false}
        inputProps={FORM_CONFIG.INPUT_STYLES}
        onFormatError={onFormatError}
        onFormatSuccess={onFormatSuccess}
        className="form-file-section"
      />
    </div>
  );
};

export default FormFileSection;
