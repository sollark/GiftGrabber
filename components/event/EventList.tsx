import { FC } from "react";
import { Event } from "@/database/models/event.model";
import { ExcelFormatType } from "@/types/excel.types";
import ListSkeleton from "@/components/ui/ListSkeleton";
import { useErrorHandler } from "@/components/ErrorBoundary";

/**
 * Props for the EventList component
 */
interface EventListProps {
  events?: Event[];
  showFormatInfo?: boolean;
  isLoading?: boolean;
  onError?: (error: Error) => void; // New prop for error callback
}

/**
 * Extended event interface with format information
 */
interface EventWithFormatInfo extends Event {
  formatInfo?: {
    applicantFormat?: ExcelFormatType;
    detectedLanguage?: string;
    processingDate?: string;
  };
}

/**
 * Enhanced EventList component with format information display.
 * Shows events with optional Excel format detection details.
 */
const EventList: FC<EventListProps> = ({
  events = [],
  showFormatInfo = false,
  isLoading = false,
  onError,
}) => {
  const { handleError, errorCount } = useErrorHandler("EventList");

  // Track errors if onError callback is provided
  const trackError = (error: Error) => {
    handleError(error);
    onError?.(error);
  };

  // Show loading skeleton when loading and no data
  if (isLoading && events.length === 0) {
    return <ListSkeleton title="Events" rows={3} columns={2} />;
  }

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No events found
        {errorCount > 0 && (
          <div style={{ fontSize: "0.8em", marginTop: "0.5rem" }}>
            {errorCount} error(s) occurred while loading events
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Events</h2>
      {events.map((event, index) => (
        <div
          key={event.eventId || index}
          className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">{event.name}</h3>
            <span className="text-sm text-gray-500">{event.eventId}</span>
          </div>

          <p className="text-gray-600 text-sm mb-2">{event.email}</p>

          <div className="flex gap-4 text-sm text-gray-500">
            <span>Applicants: {event.applicantList?.length || 0}</span>
            <span>Gifts: {event.giftList?.length || 0}</span>
          </div>

          {/* Format information display */}
          {showFormatInfo && (event as EventWithFormatInfo).formatInfo && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="font-medium">Processing Details:</div>
                {(event as EventWithFormatInfo).formatInfo?.applicantFormat && (
                  <div>
                    Applicant Format:{" "}
                    {(event as EventWithFormatInfo).formatInfo?.applicantFormat}
                  </div>
                )}
                {(event as EventWithFormatInfo).formatInfo
                  ?.detectedLanguage && (
                  <div>
                    Language:{" "}
                    {
                      (event as EventWithFormatInfo).formatInfo
                        ?.detectedLanguage
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;
