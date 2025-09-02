# GiftGrabber Database Service & Performance Monitoring

## 1. Overview

The GiftGrabber Database Service module provides a robust abstraction layer over MongoDB, ensuring all business logic interacts with the database using public identifiers (publicId) rather than internal MongoDB `_id` values. This approach enforces a clear separation between internal persistence and external API contracts, supporting security, maintainability, and future-proofing. The module addresses common data access challenges—such as N+1 query patterns, inefficient lookups, and lack of observability—by introducing batch operations, strategic database indexes, and real-time query performance monitoring. It is designed for a layered, functional architecture, emphasizing type safety, error handling, and performance optimization throughout the data access layer.

---

## 2. Key Files and Their Roles

### `/service/databaseService.ts`

- **Purpose**: Centralizes all database operations for core entities (Person, Event, Gift, Order) using publicId as the primary interface.
- **Key Exports**:
  - `PersonService`, `EventService`, `GiftService`, `OrderService`: CRUD and batch operations for each entity, always using publicId.
  - `PUBLIC_FIELD_SELECTIONS`, `POPULATION_CONFIG`: Standardized field and population configs for consistent, secure queries.
  - Utility functions: `getObjectIdFromPublicId`, `getObjectIdsFromPublicIds` for safe internal lookups.
- **Interactions**: Used by server actions, business logic, and API layers; interacts with Mongoose models and population helpers.
- **Design Decisions**:
  - Strict publicId abstraction for all business logic.
  - Batch and parallel query support to eliminate N+1 patterns.
  - All queries return functional `Result<T, E>` types for robust error handling.

### `/database/performance.ts`

- **Purpose**: Adds real-time query performance monitoring to all Mongoose models.
- **Key Exports**:
  - `enableQueryPerformanceMonitoring()`: Globally enables slow query detection and logging.
  - `DatabaseMetrics`: Tracks and exposes aggregate query statistics for diagnostics.
- **Interactions**: Imported and invoked in the database connection setup; logs to console and can be extended for external monitoring.
- **Design Decisions**:
  - Middleware pattern for non-intrusive, cross-cutting performance tracking.
  - Configurable slow query threshold and environment-aware logging.

---

## 3. Core Logic and Flow

- **Primary Workflow**:

  - All business logic calls service methods (e.g., `EventService.create`), passing only publicIds.
  - Service methods resolve publicIds to internal `_id` values as needed, using batch queries for efficiency.
  - Queries use standardized field selections and population configs to minimize data transfer and enforce security.
  - All results are wrapped in `Result<T, E>` for explicit error handling.
  - Performance monitoring middleware logs query durations and flags slow queries in real time.

- **Critical State Changes**:

  - Creation, update, and lookup operations always translate publicId to `_id` internally, never exposing `_id` outside the service layer.
  - Batch operations (e.g., `createMany`, `findManyByPublicIds`) replace loops of single queries, reducing database round-trips.
  - Indexes are created at the schema level for all frequently queried fields, ensuring efficient lookups and scalability.

- **Non-Obvious Logic**:
  - Query performance monitoring is applied globally via a plugin, requiring no changes to individual model code.
  - All population and field selection logic is centralized, preventing accidental over-fetching or data leaks.
  - Deprecated methods (e.g., `findAll`) are clearly marked and replaced with paginated, optimized alternatives.

---

## 4. Usage Examples

### Minimal Setup

```typescript
import { enableQueryPerformanceMonitoring } from "@/database/performance";
import { connectToDatabase } from "@/database/connect";

// Enable monitoring and connect to MongoDB
enableQueryPerformanceMonitoring();
await connectToDatabase();
```

### Common Usage Pattern

```typescript
import { EventService } from "@/service/databaseService";

// Create a new event using only publicIds
const result = await EventService.create({
  name: "Holiday Party",
  email: "host@example.com",
  eventId: "EVT-123",
  ownerId: "USR-456",
  eventQRCodeBase64: "...",
  ownerIdQRCodeBase64: "...",
  applicantPublicIds: ["USR-789", "USR-101"],
  giftPublicIds: ["GFT-303", "GFT-404"],
});

if (result._tag === "Success") {
  console.log("Event created:", result.value.publicId);
} else {
  console.error("Failed to create event:", result.error);
}
```

### Advanced Feature: Batch Lookup and Performance Metrics

```typescript
import { PersonService } from "@/service/databaseService";
import { DatabaseMetrics } from "@/database/performance";

// Batch lookup for multiple persons by publicId
const peopleResult = await PersonService.findManyByPublicIds([
  "USR-1",
  "USR-2",
]);
if (peopleResult._tag === "Success") {
  peopleResult.value.forEach((person) => console.log(person.firstName));
}

// Access real-time query performance metrics
console.log(DatabaseMetrics.getMetrics());
```

---

## 5. Best Practices and Extension Points

- **Guidelines**:

  - Always use publicId for all business logic and API interactions.
  - Use batch methods (`createMany`, `findManyByPublicIds`) for any operation involving multiple entities.
  - Prefer paginated queries (`findAllPaginated`) over legacy `findAll` for scalability.
  - Monitor query performance in development and production to catch slow queries early.

- **Common Pitfalls**:

  - Avoid using internal `_id` values outside the service layer.
  - Do not bypass service methods with raw model queries—this breaks abstraction and may miss optimizations.
  - Forgetting to enable performance monitoring will result in lost observability.

- **Extension Points**:

  - Add new batch or aggregation methods to the service classes as business needs evolve.
  - Extend `DatabaseMetrics` to export metrics to external monitoring systems.
  - Customize or tune index definitions in the Mongoose schemas for new query patterns.

- **Testing/Debugging Tips**:
  - Use the `Result<T, E>` return type to handle and test all error cases explicitly.
  - Check the console for slow query warnings and performance logs.
  - Use the utility functions to safely convert publicIds to ObjectIds in custom scripts.

---

## 6. Summary

Use the GiftGrabber Database Service and Performance Monitoring modules whenever you need secure, efficient, and maintainable data access in the application. By enforcing a strict publicId abstraction, batch operations, and real-time query monitoring, this module ensures that all database interactions are robust, scalable, and observable. Its design supports long-term maintainability, easy extension, and high performance, making it a foundational component for any complex, data-driven feature in the GiftGrabber system.
