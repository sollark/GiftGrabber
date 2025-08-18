import ControlledTextInput from "@/ui/form/ControlledTextInput";
import { FORM_CONFIG } from "@/config/eventFormConfig";

/**
 * Component for rendering text input fields
 */
const FormInputSection = () => (
  <div>
    <ControlledTextInput
      name="eventName"
      label="Event name"
      type="text"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
    <ControlledTextInput
      name="eventEmail"
      label="Event email"
      type="email"
      variant="outlined"
      inputProps={FORM_CONFIG.INPUT_STYLES}
    />
  </div>
);

export default FormInputSection;
