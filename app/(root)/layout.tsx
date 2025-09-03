import { Footer, Header, Main } from "@/ui/layout";
import AppProviders from "@/utils/context-composers";
import ErrorBoundary from "@/components/ErrorBoundary";
import { FC, ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

/**
 * AppLayout component
 * Wraps all pages in global context providers and error boundary.
 * @param children - React node representing page content
 * @returns JSX.Element
 * @publicAPI
 */
const AppLayout: FC<AppLayoutProps> = ({ children }: AppLayoutProps) => {
  return (
    <AppProviders>
      <ErrorBoundary>
        <Header />
        <Main>{children}</Main>
        <Footer />
      </ErrorBoundary>
    </AppProviders>
  );
};

export default AppLayout;
