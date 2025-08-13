import Footer from "../../ui/layout/Footer";
import Header from "../../ui/layout/Header";
import Main from "../../ui/layout/Main";
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
