#!/usr/bin/env node

/**
 * Clear Logs Script
 *
 * This script removes all log files from the logs directory.
 * Useful for cleaning up during development or maintenance.
 *
 * Usage:
 *   npm run clear-logs
 *   node scripts/clearLogs.js
 *
 * Options:
 *   --force, -f    Delete without confirmation prompt
 *   --help, -h     Show help message
 *
 * @author System
 * @version 1.0.0
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Configuration
const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_EXTENSIONS = [".log"];

// Parse command line arguments
const args = process.argv.slice(2);
const hasForceFlag = args.includes("--force") || args.includes("-f");
const hasHelpFlag = args.includes("--help") || args.includes("-h");

/**
 * Display help message
 */
function showHelp() {
  console.log(`
Clear Logs Script

This script removes all log files from the logs directory.

Usage:
  npm run clear-logs
  node scripts/clearLogs.js [options]

Options:
  --force, -f    Delete without confirmation prompt
  --help, -h     Show this help message

Examples:
  node scripts/clearLogs.js           # Interactive mode with confirmation
  node scripts/clearLogs.js --force   # Delete immediately without confirmation
`);
}

/**
 * Check if a file is a log file based on extension
 */
function isLogFile(filename) {
  return LOG_EXTENSIONS.some((ext) => filename.endsWith(ext));
}

/**
 * Get all log files in the logs directory
 */
function getLogFiles() {
  if (!fs.existsSync(LOG_DIR)) {
    return [];
  }

  try {
    const files = fs.readdirSync(LOG_DIR);
    return files.filter(isLogFile).map((file) => ({
      name: file,
      path: path.join(LOG_DIR, file),
      size: fs.statSync(path.join(LOG_DIR, file)).size,
    }));
  } catch (error) {
    console.error("Error reading logs directory:", error.message);
    return [];
  }
}

/**
 * Format file size in human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Delete all log files
 */
function deleteLogFiles(logFiles) {
  let deletedCount = 0;
  let errors = [];

  logFiles.forEach((file) => {
    try {
      fs.unlinkSync(file.path);
      console.log(`✓ Deleted: ${file.name} (${formatFileSize(file.size)})`);
      deletedCount++;
    } catch (error) {
      console.error(`✗ Failed to delete ${file.name}: ${error.message}`);
      errors.push({ file: file.name, error: error.message });
    }
  });

  // Remove logs directory if it's empty
  try {
    if (fs.existsSync(LOG_DIR)) {
      const remainingFiles = fs.readdirSync(LOG_DIR);
      if (remainingFiles.length === 0) {
        fs.rmdirSync(LOG_DIR);
        console.log("✓ Removed empty logs directory");
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not remove logs directory: ${error.message}`);
  }

  return { deletedCount, errors };
}

/**
 * Prompt user for confirmation
 */
function promptConfirmation(logFiles) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const totalSize = logFiles.reduce((sum, file) => sum + file.size, 0);

    console.log(
      `\nFound ${logFiles.length} log file(s) (${formatFileSize(
        totalSize
      )} total):`
    );
    logFiles.forEach((file) => {
      console.log(`  - ${file.name} (${formatFileSize(file.size)})`);
    });

    rl.question("\nDo you want to delete these files? (y/N): ", (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Main function
 */
async function main() {
  console.log("🗑️  Clear Logs Script");
  console.log("==================");

  // Show help if requested
  if (hasHelpFlag) {
    showHelp();
    process.exit(0);
  }

  // Get log files
  const logFiles = getLogFiles();

  if (logFiles.length === 0) {
    console.log("✅ No log files found. Nothing to clean up.");
    process.exit(0);
  }

  // Ask for confirmation unless force flag is used
  let shouldDelete = hasForceFlag;

  if (!hasForceFlag) {
    shouldDelete = await promptConfirmation(logFiles);
  }

  if (!shouldDelete) {
    console.log("❌ Operation cancelled.");
    process.exit(0);
  }

  // Delete log files
  console.log("\n🗑️  Deleting log files...");
  const result = deleteLogFiles(logFiles);

  // Show results
  console.log("\n📊 Results:");
  console.log(`   Deleted: ${result.deletedCount} file(s)`);

  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.length}`);
    console.log("\n❗ Errors encountered:");
    result.errors.forEach((error) => {
      console.log(`   - ${error.file}: ${error.error}`);
    });
    process.exit(1);
  } else {
    console.log("✅ All log files cleared successfully!");
    process.exit(0);
  }
}

// Handle errors gracefully
process.on("uncaughtException", (error) => {
  console.error("❌ Unexpected error:", error.message);
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("\n❌ Operation interrupted by user.");
  process.exit(0);
});

// Run the script
main().catch((error) => {
  console.error("❌ Script failed:", error.message);
  process.exit(1);
});
