import dynamic from "next/dynamic";
import { Suspense } from "react";
import { CircularProgress, Box, Typography } from "@mui/material";

// Simple loading component
const LoadingFallback = ({ message }: { message?: string }) => (
  <Box display="flex" flexDirection="column" alignItems="center" p={4}>
    <CircularProgress />
    {message && (
      <Typography variant="body2" sx={{ mt: 2 }}>
        {message}
      </Typography>
    )}
  </Box>
);

// Lazy load heavy components with loading fallbacks
const CreateEventForm = dynamic(
  () => import("@/components/event/CreateEventForm"),
  {
    loading: () => <LoadingFallback message="Loading event creation form..." />,
    ssr: false, // Disable SSR for heavy interactive components
  }
);

const EventList = dynamic(() => import("@/components/event/EventList"), {
  loading: () => <LoadingFallback message="Loading events..." />,
});

const FormFileSection = dynamic(
  () => import("@/components/event/FormFileSection"),
  {
    loading: () => <LoadingFallback message="Loading file section..." />,
  }
);

const QRCodeSection = dynamic(
  () => import("@/components/event/QRCodeSection"),
  {
    loading: () => <LoadingFallback message="Loading QR code..." />,
  }
);

// Performance-optimized component exports
export { CreateEventForm, EventList, FormFileSection, QRCodeSection };

// Preload critical components on hover/focus
export const preloadComponents = {
  createEvent: () => {
    import("@/components/event/CreateEventForm");
    import("@/components/event/FormFileSection");
  },
  eventList: () => {
    import("@/components/event/EventList");
    import("@/components/event/QRCodeSection");
  },
};

// Usage in pages:
/*
<div
  onMouseEnter={() => preloadComponents.createEvent()}
  onFocus={() => preloadComponents.createEvent()}
>
  <Suspense fallback={<LoadingFallback />}>
    <CreateEventForm />
  </Suspense>
</div>
*/
