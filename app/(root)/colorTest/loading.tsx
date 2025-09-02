/**
 * loading.tsx - Route-level loading indicator for /colorTest
 *
 * Purpose: Displays a loading spinner or message while the /colorTest route or its subroutes are loading in Next.js App Router.
 * Usage: Automatically shown during navigation or data fetching for /colorTest. Improves user experience by providing feedback.
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
