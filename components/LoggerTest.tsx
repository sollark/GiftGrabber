// Direct logger test - bypasses any caching issues
import logger from "@/lib/logger";

console.log("🔥 DIRECT LOGGER TEST FILE");
console.log("Logger object:", logger);

// Test all logger methods
logger.log("✅ logger.log works");
logger.info("✅ logger.info works");
logger.warn("✅ logger.warn works");
logger.error("✅ logger.error works");
console.log("🔥 [IMPORTANT] ✅ Direct console.log for important messages");

export default function LoggerTest() {
  return (
    <div
      style={{ padding: "20px", backgroundColor: "#f0f0f0", margin: "20px" }}
    >
      <h2>Logger Test Component</h2>
      <p>Check the browser console for log messages</p>
      <p>This component tests the logger directly</p>
    </div>
  );
}
