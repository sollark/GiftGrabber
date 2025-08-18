// Unified Excel configuration for GiftGrabber
// Combines Excel-to-Table and Excel-to-JSON settings

export const EXCEL_CONFIG = {
  MIME_TYPE: "text/html",
  WORKBOOK_TYPE: "array" as const,
  HEADER_ROW_INDEX: 1,
  DEFAULT_SHEET_INDEX: 0,
  FALLBACK_HTML: "<div></div>",
  // Performance optimizations
  DYNAMIC_IMPORT: true,
  LAZY_LOAD_THRESHOLD: 50, // KB - files smaller than this load synchronously
  // Advanced processing features
  ENHANCED_PROCESSING: {
    ENABLE_FORMAT_DETECTION: true,
    ENABLE_LANGUAGE_DETECTION: true,
    ENABLE_VALIDATION: true,
    CACHE_TRANSLATIONS: true,
    DEFAULT_LANGUAGE: "auto" as const,
    SUPPORTED_LANGUAGES: ["en", "he", "ru"] as const,
  },
  // Legacy compatibility
  LEGACY_SUPPORT: {
    ENABLE_FALLBACK: true,
    MAINTAIN_OLD_API: true,
    WARN_ON_LEGACY_USE: false,
  },
} as const;
