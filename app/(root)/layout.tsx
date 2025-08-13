import { Footer, Header, Main } from "../../ui/layout";
import { FC, ReactNode } from "react";

type AppLayoutProps = {
  children: ReactNode;
};

const AppLayout: FC<AppLayoutProps> = ({ children }: AppLayoutProps) => {
  return (
    <>
      <Header />
      <Main>{children}</Main>
      <Footer />
    </>
  );
};

export default AppLayout;
