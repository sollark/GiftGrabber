/**
 * loading.tsx - Route-level loading indicator for /events
 *
 * Purpose: Displays a loading spinner or message while the /events route or its subroutes are loading in Next.js App Router.
 * Usage: Automatically shown during navigation or data fetching for /events. Improves user experience by providing feedback.
 * Importance: Do not remove unless you want to lose custom loading feedback for this route.
 */

const Loading = () => {
  return (
    <div className="spinner">
      {/* Add your spinner component here */}
      Loading...
    </div>
  );
};

export default Loading;
