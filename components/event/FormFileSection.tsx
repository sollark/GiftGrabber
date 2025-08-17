import ControlledFileInput from "@/ui/form/ControlledFileInput";

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
      label="List of approvers (optional)"
      type="file"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
      required={false}
    />
  </div>
);

export default FormFileSection;
