import "@/app/styles/normalize.css";
import "@/app/styles/app.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import { AuthProvider } from "@/app/providers/AuthProvider";
import { AlarmProvider } from "@/app/providers/AlarmProvider";
import { DmProvider } from "@/app/providers/DmProvider";
import Footer from "@/app/components/Footer";
import Header from "@/app/components/Header";
import { LocaleProvider } from "@/app/providers/LocaleProvider";
import ScrollTopButton from "@/app/components/ScrollTopButton";

export const metadata = {
  title: "Nationwide",
  description: "Nationwide application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
          defer
        ></script>
      </head>
      <body>
        <LocaleProvider>
          <AuthProvider>
            <AlarmProvider>
              <DmProvider>
                <div className="App">
                  <Header />
                  <main>{children}</main>
                  <ScrollTopButton />
                  <Footer />
                </div>
              </DmProvider>
            </AlarmProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
