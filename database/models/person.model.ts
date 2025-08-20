import { Schema, Types, model, models } from "mongoose";
import { ExcelFormatType } from "@/types/excel.types";

export type Person = {
  // _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  personId?: string;
  sourceFormat: ExcelFormatType;
};

type PersonDoc = {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  personId?: string;
  sourceFormat: ExcelFormatType;
};

const personSchema: Schema = new Schema({
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  employeeId: { type: String, required: false },
  personId: { type: String, required: false },
  sourceFormat: {
    type: String,
    enum: Object.values(ExcelFormatType),
    required: true,
  },
});

const PersonModel = models.Person || model<PersonDoc>("Person", personSchema);

export default PersonModel;
