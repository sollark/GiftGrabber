import { Schema, Types, model, models } from "mongoose";
import { nanoid } from "nanoid";
import { ExcelFormatType } from "@/types/excel.types";

export type Person = {
  publicId: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  personId?: string;
  sourceFormat: ExcelFormatType;
};

type PersonDoc = {
  _id: Types.ObjectId;
  publicId: string;
  firstName?: string;
  lastName?: string;
  employeeId?: string;
  personId?: string;
  sourceFormat: ExcelFormatType;
};

const personSchema: Schema = new Schema({
  publicId: {
    type: String,
    required: true,
    unique: true,
    default: () => nanoid(),
  },
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
