/**
 * person.model.ts
 *
 * Purpose: Mongoose model definition for Person entities in the gift management system
 *
 * Main Responsibilities:
 * - Defines Person schema with public ID strategy for external API safety
 * - Supports multiple Excel import formats for flexible data ingestion
 * - Provides optimized database indexes for common query patterns
 * - Handles person identification through employeeId, personId, or names
 * - Maintains referential integrity with Gift and Order models
 *
 * Architecture Role:
 * - Core entity model representing gift recipients and event participants
 * - Uses nanoid for public-facing identifiers to avoid exposing MongoDB ObjectIds
 * - Supports multi-format Excel imports through sourceFormat field
 * - Referenced by Gift model (owner/applicant) and Order model (applicant)
 * - Optimized for autocomplete, search, and bulk import operations
 */

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

// ============================================================================
// DATABASE INDEXES - Issue E Fix
// ============================================================================

// Primary lookup index - removed because unique: true already creates this index
// personSchema.index({ publicId: 1 }); // Most common external API query

// Excel import identifier indexes
personSchema.index({ employeeId: 1 }); // Employee lookup
personSchema.index({ personId: 1 }); // Person ID lookup

// Name-based queries for autocomplete/search
personSchema.index({ firstName: 1, lastName: 1 }); // Full name search
personSchema.index({ lastName: 1 }); // Last name search

// Source format queries for data management
personSchema.index({ sourceFormat: 1 });

// Compound indexes for efficient filtering
personSchema.index({ sourceFormat: 1, employeeId: 1 }); // Excel format + ID
personSchema.index({ sourceFormat: 1, personId: 1 }); // Excel format + person ID

const PersonModel = models.Person || model<PersonDoc>("Person", personSchema);

export default PersonModel;
