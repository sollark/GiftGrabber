import ControlledFileInput from "../../ui/form/ControlledFileInput";
import QRcode from "@/ui/data-display/QRcode";

const FORM_CONFIG = {
  INPUT_STYLES: { style: { fontSize: 24 } },
} as const;

/**
 * Component for rendering file input fields
 */
const FormFileSection = () => (
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
      label="List of approvers"
      type="file"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
  </div>
);

export default FormFileSection;
