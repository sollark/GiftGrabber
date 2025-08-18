# i18n Excel Import Solution

## Overview

This solution provides a comprehensive, performance-optimized Excel import system with multi-language header support using the i18n pattern. The system automatically detects Excel file formats and supports English, Hebrew, and Russian headers.

## Architecture

### 📁 File Structure

```
i18n/
├── locales/
│   ├── en/translate.json     # English translations & headers
│   ├── he/translate.json     # Hebrew translations & headers
│   └── ru/translate.json     # Russian translations & headers
types/
└── excel.types.ts            # TypeScript definitions
utils/
├── excel_utils.ts            # Core Excel processing
├── excel-import-examples.ts  # Usage examples
└── utils.ts                  # Legacy wrapper function
```

## Features

### 🌍 Multi-Language Support

- **English**: Standard Excel headers (id, name, last_name, etc.)
- **Hebrew**: Hebrew headers (מזהה, שם, שם משפחה, etc.)
- **Russian**: Russian headers (ид, имя, фамилия, etc.)
- **Auto-Detection**: Automatically detects the language based on headers

### 📊 Format Types

#### `CompleteEmployeeFormat`

Complete employee information with all identifiers.

- **Fields**: `id`, `firstName`, `lastName`, `employee_number`
- **English Headers**: ["id", "name", "last_name", "employee_number"]
- **Hebrew Headers**: ["מזהה", "שם", "שם משפחה", "מספר עובד"]
- **Russian Headers**: ["ид", "имя", "фамилия", "номер_сотрудника"]

#### `BasicNameFormat`

Basic personal information.

- **Fields**: `firstName`, `lastName`
- **English Headers**: ["name", "last_name"]
- **Hebrew Headers**: ["שם", "שם משפחה"]
- **Russian Headers**: ["имя", "фамилия"]

#### `WorkerIdOnlyFormat`

Worker identification list.

- **Fields**: `worker_id`
- **English Headers**: ["worker_id"]
- **Hebrew Headers**: ["מזהה עובד"]
- **Russian Headers**: ["ид_работника"]

#### `PersonIdOnlyFormat`

Personal identification numbers.

- **Fields**: `person_id_number`
- **English Headers**: ["person_id_number"]
- **Hebrew Headers**: ["תעודת זהות"]
- **Russian Headers**: ["паспорт"]

## Performance Optimizations

### 🚀 Bundle Size

- **Dynamic Imports**: Translation files loaded only when needed
- **Tree Shaking**: Only required translations are bundled
- **Lazy Loading**: Excel parsing code loaded on demand

### ⚡ Runtime Performance

- **Translation Caching**: Loaded translations cached in memory
- **Format Detection Caching**: File format detection results cached
- **O(1) Header Lookup**: Pre-built Maps for instant header matching
- **Single-Pass Processing**: Headers processed in one iteration

### 🧠 Memory Management

- **WeakMap Caching**: Automatic garbage collection for file caches
- **Efficient Data Structures**: Pre-compiled Maps reduce allocations
- **Selective Loading**: Only active language translations in memory

## Return Object Examples

The `parseExcelFile` function returns an `ExcelImportResult` object with the following structure:

### Successful Complete Employee Format

```typescript
const result: ExcelImportResult = {
  formatType: ExcelFormatType.COMPLETE_EMPLOYEE,
  data: [
    {
      id: "EMP001",
      firstName: "John",
      lastName: "Smith",
      employee_number: "123456",
    },
    {
      id: "EMP002",
      firstName: "Jane",
      lastName: "Doe",
      employee_number: "123457",
    },
  ],
  totalRecords: 2,
  validRecords: 2,
  errors: undefined, // No errors
  language: "en",
};
```

### Basic Name Format with Validation Errors

```typescript
const result: ExcelImportResult = {
  formatType: ExcelFormatType.BASIC_NAME,
  data: [
    {
      firstName: "Sarah",
      lastName: "Wilson",
    },
    {
      firstName: "David",
      lastName: "Brown",
    },
  ],
  totalRecords: 3,
  validRecords: 2,
  errors: ["Row 3: Missing required fields"],
  language: "en",
};
```

### Hebrew Headers - Worker ID Format

```typescript
const result: ExcelImportResult = {
  formatType: ExcelFormatType.EMPLOYEE_ID_ONLY,
  data: [{ worker_id: "W001" }, { worker_id: "W002" }, { worker_id: "W003" }],
  totalRecords: 3,
  validRecords: 3,
  errors: undefined,
  language: "he",
};
```

### Russian Headers with Processing Errors

```typescript
const result: ExcelImportResult = {
  formatType: ExcelFormatType.PERSON_ID_ONLY,
  data: [{ person_id_number: "123456789" }, { person_id_number: "987654321" }],
  totalRecords: 4,
  validRecords: 2,
  errors: ["Row 3: Missing required fields", "Row 4: Invalid data format"],
  language: "ru",
};
```

### Large File with Empty Rows Skipped

```typescript
// Configuration: { skipEmptyRows: true, validateRequired: true }
const result: ExcelImportResult = {
  formatType: ExcelFormatType.COMPLETE_EMPLOYEE,
  data: [
    {
      id: "EMP001",
      firstName: "John",
      lastName: "Smith",
      employee_number: "123456",
    },
    // Empty rows were skipped
  ],
  totalRecords: 5, // Including empty/invalid rows
  validRecords: 1, // Only successfully processed rows
  errors: ["Row 4: Missing required fields"],
  language: "en",
};
```

### No Validation Mode

```typescript
// Configuration: { validateRequired: false }
const result: ExcelImportResult = {
  formatType: ExcelFormatType.BASIC_NAME,
  data: [
    {
      firstName: "John",
      lastName: "Smith",
    },
    {
      firstName: "", // Empty but included
      lastName: "Doe",
    },
  ],
  totalRecords: 2,
  validRecords: 2, // All records accepted
  errors: undefined,
  language: "en",
};
```

## API Reference

### Main Function: `parseExcelFile`

```typescript
export async function parseExcelFile(
  file: File,
  config: ExcelImportConfig = {}
): Promise<ExcelImportResult>;
```

**Parameters:**

- `file`: Excel file to process
- `config`: Optional configuration object

**Returns:** Promise resolving to `ExcelImportResult` with:

- `formatType`: Detected Excel format type
- `data`: Array of converted records
- `totalRecords`: Total number of rows processed
- `validRecords`: Number of successfully validated records
- `errors`: Array of error messages (if any)
- `language`: Detected or specified language

### Utility Functions

```typescript
// Get localized format display name
export async function getFormatDisplayName(
  formatType: ExcelFormatType,
  language: SupportedLanguage = "en"
): Promise<string>;

// Get expected headers for a format
export async function getExpectedHeaders(
  formatType: ExcelFormatType,
  language: SupportedLanguage = "en"
): Promise<string[]>;

// Map headers to normalized field names
export async function mapHeaders(
  rawHeaders: string[],
  preferredLanguage: "en" | "he" | "ru" | "auto" = "auto"
): Promise<HeaderMapping[]>;

// Detect Excel format from headers
export async function detectExcelFormat(
  headers: string[],
  config: ExcelImportConfig = {}
): Promise<FormatDetectionResult>;
```

## Usage Examples

### Basic Usage

```typescript
import { parseExcelFile } from "@/utils/excel_utils";

// Auto-detect language and format
const result = await parseExcelFile(file, {
  language: "auto",
  skipEmptyRows: true,
  validateRequired: true,
});

console.log(`Format: ${result.formatType}`);
console.log(`Language: ${result.language}`);
console.log(`Records: ${result.validRecords}/${result.totalRecords}`);
```

### Force Specific Language

```typescript
// Force Hebrew language detection
const result = await parseExcelFile(file, {
  language: "he",
  validateRequired: false,
});
```

### Type-Safe Data Processing

```typescript
import { ExcelFormatType } from "@/types/excel.types";

if (result.formatType === ExcelFormatType.COMPLETE_EMPLOYEE) {
  result.data.forEach((record) => {
    // TypeScript knows this is CompleteEmployeeFormat
    console.log(`${record.firstName} ${record.lastName} (${record.id})`);
  });
}

// Error handling
if (result.errors && result.errors.length > 0) {
  console.warn("Import completed with errors:", result.errors);
}
```

### Advanced Configuration

```typescript
const result = await parseExcelFile(file, {
  skipEmptyRows: true, // Skip rows with no data
  validateRequired: true, // Validate required fields
  language: "auto", // Auto-detect language
});

// Process results
result.data.forEach((record, index) => {
  console.log(`Record ${index + 1}:`, record);
});
```

### Working with Specific Format Types

```typescript
// Type-safe usage with specific format
import { CompleteEmployeeFormat } from "@/types/excel.types";

const result = await parseExcelFile(file);

if (result.formatType === ExcelFormatType.COMPLETE_EMPLOYEE) {
  const employees = result.data as CompleteEmployeeFormat[];

  employees.forEach((employee) => {
    console.log({
      fullName: `${employee.firstName} ${employee.lastName}`,
      id: employee.id,
      employeeNumber: employee.employee_number,
    });
  });
}
```

## Configuration Options

```typescript
interface ExcelImportConfig {
  skipEmptyRows?: boolean; // Skip rows with no data (default: false)
  validateRequired?: boolean; // Validate required fields (default: false)
  language?: "en" | "he" | "ru" | "auto"; // Language preference (default: "auto")
}
```

### Configuration Examples

```typescript
// Strict validation mode
const strictResult = await parseExcelFile(file, {
  validateRequired: true,
  skipEmptyRows: true,
  language: "en",
});

// Permissive mode - accept all data
const permissiveResult = await parseExcelFile(file, {
  validateRequired: false,
  skipEmptyRows: false,
  language: "auto",
});

// Hebrew-specific processing
const hebrewResult = await parseExcelFile(file, {
  language: "he",
  validateRequired: true,
});
```

## Error Handling

### Localized Error Messages

Errors are automatically returned in the detected language:

```typescript
// English
"Row 3: Missing required fields";
"Excel file is empty or invalid";
"Unrecognized Excel format. Available headers: id, name, last_name";

// Hebrew
"שורה 3: חסרים שדות נדרשים";
"קובץ האקסל ריק או לא תקין";
"פורמט אקסל לא מזוהה. כותרות זמינות: מזהה, שם, שם משפחה";

// Russian
"Строка 3: Отсутствуют обязательные поля";
"Файл Excel пуст или недействителен";
"Нераспознанный формат Excel. Доступные заголовки: ид, имя, фамилия";
```

### Error Types

- **Empty File**: File has no data or is corrupted
- **Unrecognized Format**: Headers don't match any known format
- **Missing Required Fields**: Record missing required data (when `validateRequired: true`)
- **Processing Error**: Error during row conversion or data parsing

### Error Handling Examples

```typescript
try {
  const result = await parseExcelFile(file, { validateRequired: true });

  // Check for processing errors
  if (result.errors && result.errors.length > 0) {
    console.warn(`Import completed with ${result.errors.length} errors:`);
    result.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // Process valid data
  console.log(
    `Successfully processed ${result.validRecords}/${result.totalRecords} records`
  );
} catch (error) {
  // Handle file-level errors (empty file, format detection failure)
  console.error("Failed to process Excel file:", error.message);
}
```

## Adding New Languages

To add support for a new language (e.g., Spanish):

1. **Create Translation File**:

   ```json
   // i18n/locales/es/translate.json
   {
     "excel_headers": {
       "id": ["id", "identificacion", "cedula"],
       "firstName": ["nombre", "primer_nombre"],
       "lastName": ["apellido", "apellido_paterno"]
       // ... other fields
     },
     "excel_formats": {
       "complete_employee": "Datos Completos del Empleado"
       // ... other formats
     },
     "excel_errors": {
       "empty_file": "El archivo Excel está vacío o no es válido"
       // ... other errors
     }
   }
   ```

2. **Update Types**:

   ```typescript
   export type SupportedLanguage = "en" | "he" | "ru" | "es";
   ```

3. **Update Functions**:
   ```typescript
   const languagesToCheck: SupportedLanguage[] =
     preferredLanguage === "auto"
       ? ["en", "he", "ru", "es"]
       : [preferredLanguage];
   ```

## Performance Metrics

### Expected Performance

- **Bundle Size Impact**: 0KB initial (dynamic loading)
- **Translation Loading**: <5ms per language
- **Format Detection**: <1ms for cached files
- **Processing Speed**: >1000 records/second for typical files
- **Memory Usage**: <2MB for translation cache

### Performance Monitoring

```typescript
const startTime = performance.now();
const result = await parseExcelFile(file);
const processingTime = performance.now() - startTime;

console.log({
  fileSize: `${(file.size / 1024).toFixed(2)} KB`,
  processingTime: `${processingTime.toFixed(2)}ms`,
  recordsPerSecond: (result.totalRecords / (processingTime / 1000)).toFixed(2),
  cacheHit: formatDetectionCache.has(file) ? "Yes" : "No",
});
```

## Type Definitions

### Core Types

```typescript
// Supported format types
export enum ExcelFormatType {
  COMPLETE_EMPLOYEE = "complete_employee",
  BASIC_NAME = "basic_name",
  EMPLOYEE_ID_ONLY = "employee_id_only",
  PERSON_ID_ONLY = "person_id_only",
}

// Main result interface
export interface ExcelImportResult<
  T extends ExcelImportFormat = ExcelImportFormat
> {
  formatType: ExcelFormatType;
  data: T[];
  totalRecords: number;
  validRecords: number;
  errors?: string[];
  language?: string;
}

// Format-specific interfaces
export interface CompleteEmployeeFormat {
  id: string;
  firstName: string;
  lastName: string;
  employee_number: string;
}

export interface BasicNameFormat {
  firstName: string;
  lastName: string;
}

export interface WorkerIdOnlyFormat {
  worker_id: string;
}

export interface PersonIdOnlyFormat {
  person_id_number: string;
}
```

## Best Practices

### 🎯 Recommended Usage

```typescript
// Recommended configuration for most use cases
const result = await parseExcelFile(file, {
  language: "auto", // Automatic language detection
  skipEmptyRows: true, // Ignore empty rows
  validateRequired: true, // Ensure data quality
});

// Always handle errors
if (result.errors?.length) {
  console.warn(`Processing completed with ${result.errors.length} errors`);
  // Show errors to user or log for debugging
}

// Use type-safe processing
if (result.formatType === ExcelFormatType.COMPLETE_EMPLOYEE) {
  result.data.forEach((employee) => {
    // TypeScript ensures all properties exist
    processEmployee(employee);
  });
}
```

### 🚫 Avoid

- **Manual language detection**: Use `language: "auto"` instead
- **Ignoring validation errors**: Always check `result.errors`
- **Bypassing type safety**: Use format-specific type checking
- **Caching translations manually**: Built-in caching is optimized
- **Processing without error handling**: Always wrap in try-catch

### 🔧 Performance Tips

- **Cache format detection**: Results are automatically cached per file
- **Use skipEmptyRows**: Reduces processing time for sparse files
- **Enable validation**: Catches data issues early
- **Monitor performance**: Use the performance monitoring example above

## Testing

### Unit Tests

```typescript
describe("Excel Import System", () => {
  test("should detect Hebrew headers correctly", async () => {
    const headers = ["מזהה", "שם", "שם משפחה"];
    const result = await detectExcelFormat(headers);

    expect(result.formatType).toBe(ExcelFormatType.BASIC_NAME);
    expect(result.language).toBe("he");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  test("should handle validation errors appropriately", async () => {
    const file = createMockExcelFile([
      { firstName: "John", lastName: "Doe" },
      { firstName: "", lastName: "Smith" }, // Invalid
    ]);

    const result = await parseExcelFile(file, { validateRequired: true });

    expect(result.validRecords).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Missing required fields");
  });
});
```

### Integration Tests

```typescript
describe("Multi-language Integration", () => {
  test("should process mixed language headers", async () => {
    // Test files with different language combinations
    const files = await loadTestFiles(["en-ru-mixed.xlsx", "he-en-mixed.xlsx"]);

    for (const file of files) {
      const result = await parseExcelFile(file, { language: "auto" });
      expect(result.formatType).toBeDefined();
      expect(result.data.length).toBeGreaterThan(0);
    }
  });
});
```

This solution provides a robust, scalable, and performance-optimized approach to Excel import with full internationalization support and comprehensive error handling.
