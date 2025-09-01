import React from "react";
import { ExcelFormatType } from "../types/excel.types";
import { Person } from "@/database/models/person.model";

/**
 * Props for PersonInfo component.
 * @param person - The person object in any supported format.
 * @param format - (Optional) The ExcelFormatType indicating the format of the person object.
 */
interface PersonInfoProps {
  person: Person;
}

/**
 * PersonInfo component displays a person in a format-agnostic way.
 */

const PersonInfo: React.FC<PersonInfoProps> = ({ person }) => {
  if (!person) return <span>Unknown</span>;

  const format = person.sourceFormat;
  const getDisplay = () => {
    switch (format) {
      case ExcelFormatType.COMPLETE_EMPLOYEE:
        if (person.firstName && person.lastName) {
          return `${person.firstName} ${person.lastName}`;
        }
        break;
      case ExcelFormatType.BASIC_NAME:
        if ((person as any).name) {
          return String((person as any).name);
        }
        break;
      case ExcelFormatType.EMPLOYEE_ID_ONLY:
        if (person.employeeId) {
          return `Employee #${person.employeeId}`;
        }
        break;
      case ExcelFormatType.PERSON_ID_ONLY:
        if (person.personId) {
          return `Person #${person.personId}`;
        }
        break;
      default:
        break;
    }
    // Fallback: Try to infer
    if (person.firstName && person.lastName) {
      return `${person.firstName} ${person.lastName}`;
    }
    if ((person as any).name) {
      return String((person as any).name);
    }
    if (person.employeeId) {
      return `Employee #${person.employeeId}`;
    }
    if (person.personId) {
      return `Person #${person.personId}`;
    }
    return JSON.stringify(person);
  };

  return <span>{getDisplay()}</span>;
};

export default PersonInfo;
