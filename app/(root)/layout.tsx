import { Footer, Header, Main } from "@/ui/layout";
import AppProviders from "@/utils/context-composers";
import { FC, ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

const AppLayout: FC<AppLayoutProps> = ({ children }: AppLayoutProps) => {
  return (
    <AppProviders>
      <>
        <Header />
        <Main>{children}</Main>
        <Footer />
      </>
    </AppProviders>
  );
};

export default AppLayout;
